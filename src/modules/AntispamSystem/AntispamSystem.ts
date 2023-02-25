import { Client, Message, TextChannel } from "discord.js";
import { antispamSystemOptions } from "../../config";
import AntispamObserver from "./classes/AntispamObserver";

export default class AntispamSystem {
	private _client: Client;
	private _antispamObserver: AntispamObserver;

	constructor(client: Client) {
		this._client = client;
		this._antispamObserver = new AntispamObserver(client);

		this._antispamObserver.on('spamDetected', (message: Message) => (this._onSpam(message)));
	}

	private async _onSpam(message: Message): Promise<void> {
		if (this._hasAdminPermissions(message.member)) return;

		await message.delete();
		await this._sendLogMessage(message);
	}

	private _hasAdminPermissions(member: Message['member']): boolean {
		for (const roleId of antispamSystemOptions.adminRoles) {
			if (member?.roles.cache.has(roleId)) return true;
		}

		return false;
	}

	private async _sendLogMessage(message: Message): Promise<void> {
		const channel = await this._client.channels.fetch(antispamSystemOptions.logsChannelId);

		if (!(channel instanceof TextChannel) || !(message.channel instanceof TextChannel)) return;
		
		channel.send(`**${message.author.tag}** отправил спам в **"${message.channel.name}"**\n \`\`\`${message.content}\`\`\``);
	}
}