import { Client, Message } from "discord.js";
import { EventEmitter } from "stream";
import SpamDetector from "./SpamDetector";

export default class AntispamObserver extends EventEmitter {
	private _spamDetector: SpamDetector;

	constructor(client: Client) {
		super();

		this._spamDetector = new SpamDetector();

		client.on('messageCreate', (message) => (this._onMessage(message)));
	}

	private _onMessage(message: Message) {
		if (message.author.bot) return;
		if (this._spamDetector.whetherTheMessageContainsSpam(message)) this.emit('spamDetected', message);
	}
}