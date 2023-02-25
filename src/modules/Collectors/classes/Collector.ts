import { Message, MessageCollector, TextChannel } from "discord.js";

export default abstract class Collector {
	private _collector: MessageCollector;

	constructor(channel: TextChannel) {
		const filter = (message: Message) => (!message.author.bot);

		this._collector = new MessageCollector(channel, { filter });
		this._collector.on('collect', (message: Message) => this.onCollect(message));
	}

	public onCollect(message: Message) { }
}