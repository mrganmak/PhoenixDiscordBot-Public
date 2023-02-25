import { Client, MessageEmbed, TextChannel } from "discord.js";

export default class ChannelSystem {
	private _client: Client;

	constructor(client: Client) {
		this._client = client;
	}

	public hasChannelExist(id: string): boolean {
		return this._client.channels.cache.has(id);
	}

	public sendMessageToChannel(id: string, content: string | MessageEmbed): boolean {
		const channel = this._client.channels.cache.get(id);

		if (!(channel instanceof TextChannel) || !channel.viewable) return false;

		channel.send((typeof content == 'string' ? content : { embeds: [content] }));

		return true;
	}
}