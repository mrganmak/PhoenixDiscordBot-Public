import { ButtonInteraction, Client, DMChannel, GuildMember, Message, MessageEmbed, TextChannel } from "discord.js";
import { ButtonComponent, Discord } from "discordx";
import { botOptions, channelIds, rolesIds } from "../../config";
import Util from "../../util/Util";
import { ControlPanel } from "../ControlPanel/ControlPanel";
import { UserAnswers, UserInteractionInterface } from "../UserInteractionInterface/UserInteractionInterface";

@Discord()
export class AccessRequest {
	public static members: Set<string> = new Set();

	@ButtonComponent('sendAccesRequest')
	private openTicket(interaction: ButtonInteraction) {
		AccessRequest.createRequest(interaction);
	}

	public static async parseLawsuits(client: Client): Promise<void> {
		const channel = await client.channels.fetch(channelIds.requests);
		if (!(channel instanceof TextChannel)) return;
		const guild = channel.guild;
		const messages = await channel.messages.fetch();

		for (const message of messages.values()) {
			const embed = message.embeds[0];
			if (!embed || message.components.length <= 0) continue;
			const memberId = embed.footer?.text;
			if (!memberId) continue;

			this.members.add(memberId);
			const member = await guild.members.fetch(memberId).catch(() => { });
			if (!member) {
				await message.delete();

				continue;
			}

			AccessRequest.members.add(member.user.id);

			new AccessRequest(message, member, false);
		}
	}

	public static async createRequest(interaction: ButtonInteraction): Promise<AccessRequest | undefined> {
		if (AccessRequest.members.has(interaction.user.id)) {
			interaction.reply({
				content: 'Ваша заявка на рассмотрении',
				ephemeral: true
			});

			return;
		}

		const member = await interaction.guild?.members.fetch(interaction.user.id);
		if (!member) return;
		const messageInDm = await member.user.send(`Заполните опрос:`).catch(() => { });
		if (!(messageInDm instanceof Message)) {
			interaction.reply({
				content: 'У вас закрыт лс, его нужно открыть',
				ephemeral: true
			});

			return
		}

		AccessRequest.members.add(interaction.user.id);
		interaction.deferUpdate();

		const channel = messageInDm.channel;
		if (!(channel instanceof DMChannel)) return;

		const userInteractionInterface = new UserInteractionInterface(channel, 'accessRequests', member);
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		const embed = this._createEmbed(answers, member);
		if (!embed) return;
		const requestsChannel = await member.client.channels.fetch(channelIds.requests);
		if (!(requestsChannel instanceof TextChannel)) return;
		const message = await requestsChannel.send({ embeds: [embed] });

		return new AccessRequest(message, member);
	}

	public static _createEmbed(answers: UserAnswers, member: GuildMember): MessageEmbed | undefined {
		const embed = new MessageEmbed();
		embed
			.setTitle(`Анкета от ${member.user.tag}`)
			.setColor('GREY')
			.setTimestamp(new Date())
			.setFooter({ text: member.user.id, iconURL: Util.getUserAvatarURL(member.user) })

		for (const answer of answers) {
			embed.addField(answer.question, answer.answer || 'Нет ответа', answer.embedOptions?.inline ?? false);
		}

		return embed;
	}

	private _message!: Message;
	private _member!: GuildMember;
	private _controlPanel!: ControlPanel;

	constructor(message: Message, member: GuildMember, isNewRequest: boolean = true) {
		if (!message) return;

		this._message = message;
		this._member = member;
		this._controlPanel = new ControlPanel(message, {
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
						},
						reject: {
							label: 'Отклонить',
							style: 'DANGER',
							categoryName: 'standart',
							categotyToGo: 'close',
							eventName: 'reject',
							necessaryRoles: [rolesIds.admin, rolesIds.moderator],
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

		this._member.user.send('Ваша заявка одобрена').catch(() => { });
		this._message.edit({ embeds: [embed] });

		this._member.roles.add(rolesIds.whitelisted);
		
		AccessRequest.members.delete(this._member.user.id);
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

		this._member.user.send('Ваша заявка отклонена').catch(() => { });
		this._message.edit({ embeds: [embed] });

		AccessRequest.members.delete(this._member.user.id);
	}
}