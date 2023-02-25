import { Client, Message, MessageAttachment, MessageCollector, MessageEmbed, TextChannel } from "discord.js";
import { channelIds } from "../../../config";
import SpamDetector from "../../AntispamSystem/classes/SpamDetector";

class CameraCollector {
	private _collector: MessageCollector;
	private _spamDetector: SpamDetector;

	constructor(channel: TextChannel) {
		const filter = (message: Message) => (!message.author.bot);
		this._collector = new MessageCollector(channel, { filter });
		this._collector.on('collect', (message: Message) => this.onCollect(message));

		this._spamDetector = new SpamDetector();
	}

	public async onCollect(message: Message) {
		if (this._spamDetector.whetherTheMessageContainsSpam(message)) return;

		const replyed = await message.fetchReference().catch(() => { });

		const embed = new MessageEmbed();
		embed
			.setDescription(message.content)
			.setColor('DARK_GREY')
			.setTimestamp(new Date())
			.setFooter({ text: 'Аноним' });

		const image = message.attachments.first();
		if (image) embed.setImage(image.proxyURL);

		if (replyed) await message.channel.send({ reply: { messageReference: replyed, failIfNotExists: false }, embeds: [embed] });
		else await message.channel.send({ embeds: [embed] });
		if (!(message.channel instanceof TextChannel)) return;

		setTimeout(() => message.delete(), 1000);

		const logsChannel = await message.client.channels.fetch(channelIds.logs);
		if (!(logsChannel instanceof TextChannel)) return;
		logsChannel.send(`**${message.author.tag}** отравил сообщение в **"${message.channel.name}"**\n\n\`\`\`${message.content}\`\`\``);
	}
}

export default async function start(client: Client) {
	const channel = await client.channels.fetch(channelIds.camera);

	if (channel instanceof TextChannel) new CameraCollector(channel);
}