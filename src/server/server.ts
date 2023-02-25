import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import bodyParser from 'body-parser';
import { Client } from 'discord.js';
import WhitelistSystem from './systems/WhitelistSystem';
import MembersSystem from './systems/MembersSystem';
import BanSystem from './systems/BanSystem';
import { ErrorsCodes, errorsMessages } from './constants/errors';
import Member from './structures/Member';
import ServerAPIError from './structures/ServerAPIError';
import ChannelSystem from './systems/ChannelSystem';

const server = express();
server.use(express.static('static'));
server.use(bodyParser.json())

const privateKey = fs.readFileSync('/etc/letsencrypt/live/<URL>/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/<URL>/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/<URL>/chain.pem', 'utf8');
const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

const httpServer = http.createServer(server);
const httpsServer = https.createServer(credentials, server);

export default class Server {
	private _whitelistSystem: WhitelistSystem;
	private _server = server;
	private _membersSystem: MembersSystem;
	private _banSystem: BanSystem;
	private _channelSystem: ChannelSystem;

	constructor(client: Client) {
		this._whitelistSystem = new WhitelistSystem(client);
		this._membersSystem = new MembersSystem(client);
		this._banSystem = new BanSystem(client);
		this._channelSystem = new ChannelSystem(client);

		httpServer.listen(80, () => {
			console.log('HTTP Server running on port 80');
		});
		
		httpsServer.listen(443, () => {
			console.log('HTTPS Server running on port 443');
		});
	
		this._server.get('/memberInfo/:id', async (req, res) => (this._checkUserInWhitelist(req, res)));
		this._server.delete('/whitelist/:id', async (req, res) => (this._deleteUserFromWhitelist(req, res)));
		this._server.post('/setNickname', (req, res) => (this._setNicknameToUser(req, res)));
		this._server.post('/sendMessage', (req, res) => (this._sendMessage(req, res)));
		this._server.put('/bans', (req, res) => (this._banAdd(req, res)));
		this._server.delete('/bans/:id', (req, res) => (this._banDelete(req, res)));
		this._server.get('/bans/:id', (req, res) => (this._banGet(req, res)));
		this._server.get('/bans/', (req, res) => (this._bansGet(req, res)));
	}

	private async _checkUserInWhitelist(req: Request, res: Response): Promise<Response> {
		console.log(`${req.params.id} connecting`)
		if (!req.params.id) return res.json({ error: new ServerAPIError(ErrorsCodes.ID_HAS_NOT_DEFINED) });
		const id = this._normalizeId(req.params.id);

		if (!(await this._membersSystem.hasMemberInGuild(id))) {
			if (!(await this._banSystem.hasUserHaveGuildBan(id))) return res.json({ error: new ServerAPIError(ErrorsCodes.MEMBER_HAS_NOT_DEFINED) });

			const ban = await this._banSystem.getUserGuildBan(id);

			return res.json(new Member(id, false, undefined, { reason: ban.reason ?? 'Причина не указана', duration: -1 }));
		};

		if (await this._banSystem.hasUserHaveServerBan(id)) {
			const ban = this._banSystem.getUserServerBan(id);
			const timePassed = new Date().getTime() - ban.banDate;

			return res.json(new Member(id, false, await this._membersSystem.getMember(id), { reason: ban.reason ?? 'Причина не указана', duration: (ban.duration == -1 ? -1 : ban.duration - timePassed) }));
		}

		const isUserWhitelisted = await this._whitelistSystem.hasUserWhitelisted(id);

		return res.json(new Member(id, isUserWhitelisted, await this._membersSystem.getMember(id)))
	}

	private async _deleteUserFromWhitelist(req: Request, res: Response): Promise<Response> {
		if (!req.params.id) return res.json({ error: new ServerAPIError(ErrorsCodes.ID_HAS_NOT_DEFINED) });

		const id = this._normalizeId(req.params.id);

		if (!(await this._membersSystem.hasMemberInGuild(id))) return res.json({ error: new ServerAPIError(ErrorsCodes.MEMBER_HAS_NOT_DEFINED) });
		if (!(await this._whitelistSystem.hasUserWhitelisted(id))) return res.json({ error: new ServerAPIError(ErrorsCodes.MEMBER_HAS_NOT_WHITELSITED) });

		await this._whitelistSystem.deleteUserFromWhitelist(id);
		
		return res.json(new Member(id, false, await this._membersSystem.getMember(id)));
	}

	private async _setNicknameToUser(req: Request, res: Response): Promise<Response | undefined> {
		if (JSON.stringify(req.body) == JSON.stringify({})) return res.json({ error: new ServerAPIError(ErrorsCodes.INVALID_DATA) });
		if (!this._checkBody(req, res, ['id', 'nickname'])) return;

		if (!req.body.id) return res.json({ error: new ServerAPIError(ErrorsCodes.ID_HAS_NOT_DEFINED) });
		const id = this._normalizeId(req.body.id);
		const nickname = req.body.nickname;

		if (!nickname) return res.json({ error: new ServerAPIError(ErrorsCodes.CANT_SET_AN_EMPY_NICKNAME) });
		if (!this._membersSystem.hasMemberInGuild(id)) return res.json({ error: new ServerAPIError(ErrorsCodes.MEMBER_HAS_NOT_DEFINED) });
		if (!await this._membersSystem.setNicknameToMember(id, nickname)) return res.json({  error: new ServerAPIError(ErrorsCodes.MISSING_PERMISSIONS) });

		return res.status(200).send();
	}

	private async _sendMessage(req: Request, res: Response): Promise<Response | undefined> {
		if (JSON.stringify(req.body) == JSON.stringify({})) return res.json({ error: new ServerAPIError(ErrorsCodes.INVALID_DATA) });
		if (!this._checkBody(req, res, ['id', 'content'])) return;

		const id = req.body.id;
		const content = req.body.content;

		if (!content) return res.json({ error: new ServerAPIError(ErrorsCodes.CANT_SEND_AN_EMPY_MESSAGE) });
		if (!this._channelSystem.hasChannelExist(id)) return res.json({ error: new ServerAPIError(ErrorsCodes.CHANNEL_DOES_NOT_EXIST) });
		if (!this._channelSystem.sendMessageToChannel(id, content)) return res.json({ error: new ServerAPIError(ErrorsCodes.CANT_SEND_MESSAGE_TO_THIS_CHANNEL) });

		return res.status(200).send();
	}

	private async _banAdd(req: Request, res: Response): Promise<Response | undefined> {
		if (JSON.stringify(req.body) == JSON.stringify({})) return res.json({ error: new ServerAPIError(ErrorsCodes.INVALID_DATA) });

		if (!this._checkBody(req, res, ['id', 'reason', 'duration'])) return;

		if (!req.body.id) return res.json({ error: new ServerAPIError(ErrorsCodes.ID_HAS_NOT_DEFINED) });

		const id = this._normalizeId(req.body.id);

		if (await this._banSystem.hasUserHaveServerBan(id)) return res.json({ error: new ServerAPIError(ErrorsCodes.THIS_USER_HAS_ALREADY_BEEN_BANNED) });

		const { reason, duration } = req.body;

		if (!(await this._banSystem.banAdd({ id, reason, duration }))) return res.json({ error: new ServerAPIError(ErrorsCodes.CANT_BAN_THIS_MEMBER) });

		return res.status(200).send();
	}

	private async _banDelete(req: Request, res: Response): Promise<Response> {
		if (!req.params.id) return res.json({ error: new ServerAPIError(ErrorsCodes.ID_HAS_NOT_DEFINED) });

		const id = this._normalizeId(req.params.id);

		if (!(await this._banSystem.hasUserHaveServerBan(id))) return res.json({ error: new ServerAPIError(ErrorsCodes.THIS_USER_HAS_NOT_BANNED) });
		if (!(await this._banSystem.banRemove(id, true))) return res.json({ error: new ServerAPIError(ErrorsCodes.CANT_UNBAN_THIS_MEMBER) });
		
		return res.status(200).send();
	}

	private async _banGet(req: Request, res: Response): Promise<Response> {
		const id = this._normalizeId(req.params.id);

		if (!(await this._banSystem.hasUserHaveServerBan(id))) return res.json({ error: new ServerAPIError(ErrorsCodes.THIS_USER_HAS_NOT_BANNED) });
	
		const ban = this._banSystem.getUserServerBan(id);
		const timePassed = new Date().getTime() - ban.banDate;

		return res.json({ id: id, reason: ban.reason ?? 'Причина не указана', duration: (ban.duration == -1 ? -1 : ban.duration - timePassed) });	
	}

	private async _bansGet(req: Request, res: Response): Promise<Response> {
		const bans = this._banSystem.getAllServerBans();

		return res.json(bans);
	}

	private _normalizeId(id: string): string {
		const splitedId = id.split(':');
	
		return (splitedId[1] ?? splitedId[0]);
	}

	private _checkBody(req: Request, res: Response, properties: Array<string>): boolean {
		const bodyProperties = Object.keys(req.body);
		const missingProperties: Array<string> = [];
		const excessProperties: Array<string> = [];

		for (const property of properties) {
			if (bodyProperties.lastIndexOf(property) == -1) missingProperties.push(property);
		}

		for (const property of bodyProperties) {
			if (properties.indexOf(property) == -1) excessProperties.push(property);
		}

		if (missingProperties.length > 0 || excessProperties.length > 0) {
			const message = `Invalid in body: ${missingProperties.length > 0 ? `Missing properties: ${missingProperties.join(' ')}; ` : ''}${excessProperties.length > 0 ? `Excess properties: ${excessProperties.join(' ')}` : ''}`;

			res.json({ error: new ServerAPIError(ErrorsCodes.INVALID_IN_BODY, message) });

			return false;
		}

		return true;
	}
}
