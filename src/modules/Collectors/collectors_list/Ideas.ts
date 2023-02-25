import { Client, Message, MessageAttachment, MessageCollector, MessageEmbed, TextChannel } from "discord.js";
import { channelIds } from "../../../config";
import * as fs from 'fs';
import SpamDetector from "../../AntispamSystem/classes/SpamDetector";
import Util from "../../../util/Util";

class IdeasCollector {
	private _collector: MessageCollector;
	private _counter: number;
	private _spamDetector: SpamDetector;

	constructor(channel: TextChannel) {
		const filter = (message: Message) => (!message.author.bot);
		this._collector = new MessageCollector(channel, { filter });
		this._collector.on('collect', (message: Message) => this.onCollect(message));

		this._counter = Number(fs.readFileSync('./counters/idea.txt'));
		this._spamDetector = new SpamDetector();
	}

	public async onCollect(message: Message) {
		if (this._spamDetector.whetherTheMessageContainsSpam(message)) return;

		this._counter++;

		const embed = new MessageEmbed();
		embed
			.setTitle(`Предложение #${this._counter}`)
			.setDescription(message.content)
			.setColor('RANDOM')
			.setTimestamp(new Date())
			.setFooter({ iconURL: Util.getUserAvatarURL(message.author), text: message?.member?.nickname || message.author.username });

		const image = message.attachments.first();
		if (image) embed.setImage(image.url);

		const ideaMessage = await message.channel.send({ embeds: [embed] });
		ideaMessage.react('👍').then(() => ideaMessage.react('👎'));
		ideaMessage.startThread({ name: `Обсуждение #${this._counter}`, autoArchiveDuration: 'MAX' })

		setTimeout(() => message.delete(), 1000);

		fs.writeFileSync('./counters/idea.txt', String(this._counter));
	}
}

export default async function start(client: Client) {
	const channel = await client.channels.fetch(channelIds.ideas);

	if (channel instanceof TextChannel) new IdeasCollector(channel);
}