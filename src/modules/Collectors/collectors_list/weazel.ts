import { Client, Message, MessageCollector, MessageEmbed, TextChannel, WebhookClient } from "discord.js";
import { channelIds } from "../../../config";
import SpamDetector from "../../AntispamSystem/classes/SpamDetector";

class WeazelCollector {
	private _collector: MessageCollector;
	private _spamDetector: SpamDetector;
	private _webhook: WebhookClient;

	constructor(channel: TextChannel) {
		const filter = (message: Message) => (!message.author.bot);
		this._collector = new MessageCollector(channel, { filter });
		this._collector.on('collect', (message: Message) => this.onCollect(message));
		this._webhook = new WebhookClient({ id: '941347782411825194', token: '7UkiAkmPPLr8Y4qNHZfPXCjliibxYrJbrZWKuByG8V7lwP1NCWvJGHTNOybxRSwfr5ze' });

		this._spamDetector = new SpamDetector();
	}

	public async onCollect(message: Message) {
		if (this._spamDetector.whetherTheMessageContainsSpam(message)) return;

		const image = message.attachments.first();

		if (image) await this._webhook.send({ content: message.content, files: [image] });
		else await this._webhook.send({ content: message.content });
		if (!(message.channel instanceof TextChannel)) return;

		setTimeout(() => message.delete(), 1000);
	}
}

export default async function start(client: Client) {
	const channel = await client.channels.fetch(channelIds.weazel);

	if (channel instanceof TextChannel) new WeazelCollector(channel);
}