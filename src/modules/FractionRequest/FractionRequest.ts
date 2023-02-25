import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { ArgsOf, Discord, On } from "discordx";
import { botOptions, channelIds, fractionRequestOptions, rolesIds } from "../../config";
import Util from "../../util/Util";
import { ControlPanel } from "../ControlPanel/ControlPanel";

@Discord()
export class FractionRequest {
	@On('messageCreate')
	private async onMessage([message]: ArgsOf<"messageCreate">): Promise<void> {
		if (message.author.bot || !fractionRequestOptions.channels.includes(message.channel.id)) return;

		FractionRequest.createRequest(message);
	}

	public static async parseRequests(client: Client): Promise<void> {
		for (const channelId of fractionRequestOptions.channels) { 
			const channel = await client.channels.fetch(channelId);
			if (!(channel instanceof TextChannel)) continue;
		
			const messages = await channel.messages.fetch();
			for (const message of messages.values()) {
				if (message.embeds.length <= 0 || message.components.length <= 0) return;

				new FractionRequest(message, false);
			}
		}
	}

	public static async createRequest(message: Message): Promise<FractionRequest | undefined> {
		await message.delete();
		
		const embed = new MessageEmbed();
		embed
			.setTitle('Запрос')
			.setDescription(message.content)
			.setColor(fractionRequestOptions.colors[message.channel.id] ?? fractionRequestOptions.defaultColor)
			.setFooter({ text: message.member?.nickname ?? message.author.username, iconURL: Util.getUserAvatarURL(message.author) });

		if (!(message.channel instanceof TextChannel)) return;

		const requestMessage = await message.channel.send({ embeds: [embed] });

		return new FractionRequest(requestMessage);
	}

	private _message!: Message;
	private _controlPanel!: ControlPanel;

	constructor(message: Message, isNewRequest: boolean = true) {
		if (!message || !(message.channel instanceof TextChannel)) return;

		this._message = message;
		this._controlPanel = new ControlPanel(this._message, {
			startCategoryName: 'standart',
			categorys: {
				standart: {
					name: 'standart',
					buttons: {
						approve: {
							label: 'Одобрить',
							style: 'SUCCESS',
							categoryName: 'standart',
							categotyToGo: 'close',
							eventName: 'approve',
							necessaryRoles: [rolesIds.admin, rolesIds.moderator],
							emoji: '➕'
						},
						reject: {
							label: 'Отклонить',
							style: 'DANGER',
							categoryName: 'standart',
							categotyToGo: 'close',
							eventName: 'reject',
							necessaryRoles: [rolesIds.admin, rolesIds.moderator],
							emoji: '✖️'
						}
					}
				},
				close: {
					name: 'close',
					buttons: { }
				}
			}
		}, isNewRequest);

		this._controlPanel.on('approve', () => (this._onApprove()));
		this._controlPanel.on('reject', () => (this._onReject()));
	}

	private async _onApprove(): Promise<void> {
		const embed = this._message.embeds[0];
		if (!embed) return;

		if (!botOptions.devMode) {
			const emoji = await this._message.guild?.emojis.fetch('509666258321539124');
			embed.addField('Решение', `Одобрено ${emoji ? emoji.toString() : ''}`).setColor([ 67, 181, 129 ]);
		} else {
			embed.addField('Решение', `Одобрено`).setColor('GREEN');
		}

		this._message.edit({ embeds: [embed] });
	}

	private async _onReject(): Promise<void> {
		const embed = this._message.embeds[0];
		if (!embed) return;

		if (!botOptions.devMode) {
			const emoji = await this._message.guild?.emojis.fetch('509666266223607819');
			embed.addField('Решение', `Отклонено ${emoji ? emoji.toString() : ''}`).setColor('RED');
		} else {
			embed.addField('Решение', 'Отклонено').setColor('RED');
		}

		this._message.edit({ embeds: [embed] });
	}
}