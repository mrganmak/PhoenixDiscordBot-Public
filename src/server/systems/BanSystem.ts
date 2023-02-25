import { Client, Guild, GuildBan, MessageEmbed } from "discord.js";
import { botOptions, guildIds, serverOptions } from "../../config";
import Util from "../../util/Util";
import BanBase, { IBanInfo } from "../base/BanBase";
import ChannelSystem from "./ChannelSystem";
import MembersSystem from "./MembersSystem";

export default class BanSystem {
	private _client: Client;
	private _guild: Guild;
	private _banBase: BanBase;
	private _membersSystem: MembersSystem;
	private _channelSystem: ChannelSystem;

	constructor(client: Client) {
		this._client = client;

		const guild = this._client.guilds.cache.get(botOptions.devMode ? guildIds.dev : guildIds.main);
		if (!guild) throw new Error('Guild i undefined');
		this._guild = guild;

		this._banBase = new BanBase();
		this._membersSystem = new MembersSystem(client);
		this._channelSystem = new ChannelSystem(client);

		setInterval(() => (this._checkBans()), 5 * 60 * 1e3);
		this._checkBans();
	}

	public async hasUserHaveGuildBan(id: string): Promise<boolean> {
		const ban = await this._guild.bans.fetch(id).catch(() => { });

		if (!(ban instanceof GuildBan)) return false;
		else return true;
	}

	public async getUserGuildBan(id: string): Promise<GuildBan> {
		return (await this._guild.bans.fetch(id));
	}

	public async hasUserHaveServerBan(id: string): Promise<boolean> {
		const member = await this._membersSystem.getMember(id);
		
		return member.roles.cache.has(serverOptions.banRole);
	}

	public getUserServerBan(id: string): IBanInfo {
		const ban = this._banBase.get(id);
		
		return ban;
	}

	public getAllServerBans(): Array<IBan> {
		const bans = this._banBase.getAll();
		const banList: Array<IBan> = [];

		for (const ban of bans) banList.push({ id: ban.id, reason: ban.reason ?? 'Причина не указана', duration: ban.duration == -1 ? -1 : (ban.duration - (new Date().getTime() - ban.banDate)) });

		return banList;
	}

	public async banAdd(ban: IBan): Promise<boolean> {
		const member = await this._membersSystem.getMember(ban.id);

		if (!member.manageable) return false;

		this._banBase.add({ id: ban.id, banDate: new Date().getTime(), duration: ban.duration, reason: ban.reason });
		this._membersSystem.addRoleToMember(ban.id, serverOptions.banRole);

		return true;
	}

	public async banRemove(id: string, removeRole: boolean = false): Promise<boolean> {
		const member = await this._membersSystem.getMember(id);

		if (!member.manageable) return false;

		this._banBase.delete(id);
		if (removeRole) this._membersSystem.removeRoleFromMember(id, serverOptions.banRole);

		return true;
	}

	private async _checkBans(): Promise<void> {
		const bans = this._banBase.getAll();
		const date = new Date();

		for (const ban of bans) {
			if (ban.duration == -1) continue;

			const timePassed = date.getTime() - ban.banDate;

			if (timePassed < ban.duration) continue;
			
			if (await this._membersSystem.hasMemberInGuild(ban.id)) this.banRemove(ban.id, true);
			else this._banBase.delete(ban.id);
		}
	}
}

interface IBan {
	id: string,
	reason: string,
	duration: number
}