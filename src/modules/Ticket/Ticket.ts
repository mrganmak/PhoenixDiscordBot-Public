import { ButtonInteraction, Client, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel, User, VoiceChannel } from 'discord.js';
import { ButtonComponent, Discord } from 'discordx';
import * as fs from 'fs';
import { channelIds, ticketsOptions } from '../../config';
import Util from '../../util/Util';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { PrivateChannel } from '../PrivateChannel/PrivateChannel';
import { UserAnswers, UserInteractionInterface } from '../UserInteractionInterface/UserInteractionInterface';
import TicketsDatabase from './base/TicketDatabase';

@Discord()
export class Ticket {
	private static _ticketsCount: number = Number(fs.readFileSync('./counters/tickets.txt'));
	private static _dataBase: TicketsDatabase = new TicketsDatabase();

	@ButtonComponent('openTicket')
	private openTicket(interaction: ButtonInteraction) {
		Ticket.createTicket(interaction);
	}

	public static async parseTickets(client: Client): Promise<void> {
		const tickets = this._dataBase.getAll();

		for (const ticket of tickets) { 
			const channel = await client.channels.fetch(ticket.channelId);
			if (!(channel instanceof TextChannel)) return;

			const message = await channel.messages.fetch(ticket.messageId);
			const member = await message.guild?.members.fetch(ticket.userId).catch(() => { });
			if (!member) continue;

			if (ticket.voiceChannelId) {
				const voiceChannel = await client.channels.fetch(ticket.voiceChannelId);
				if (!(voiceChannel instanceof VoiceChannel)) return;

				new Ticket(message, member, ticket.number, false, voiceChannel);
			};

			new Ticket(message, member, ticket.number, false);
		}

	}

	public static async createTicket(interaction: ButtonInteraction): Promise<Ticket | undefined> {
		interaction.deferUpdate();

		if (this._hasUserHaveMaxTickets(interaction.user.id)) {
			interaction.reply({
				content: 'У тебя открыто больше 3-ёх тикетов, закрой хотя бы один. Если у тебя меньше 3-ёх тикетов, напиши в лс одному из администраторов.',
				ephemeral: true
			});
			return;
		}

		this._ticketsCount += 1;

		const member = await interaction.guild?.members.fetch(interaction.user.id);
		if (!member) return;

		const privateChannel = await PrivateChannel.createChannel('text', `ticket #${this._ticketsCount}`, member, ticketsOptions.ticketsCategory);

		if (privateChannel.type !== 'text') return;
		const channel = privateChannel.channel;

		const embed = new MessageEmbed();
		embed
			.setTitle(`Тикет ${this._ticketsCount}`)
			.setDescription('Снизу расположены кнопки для управления вашим тикетом')
			.setColor('PURPLE');

		channel.send(interaction.user.toString());
		const message = await channel.send({ embeds: [embed] });

		this._createTemplate(channel, member);
		fs.writeFileSync('./counters/tickets.txt', String(this._ticketsCount));
		this._dataBase.add({ userId: interaction.user.id, channelId: channel.id, messageId: message.id, number: this._ticketsCount, voiceChannelId: undefined });

		return new Ticket(message, member, this._ticketsCount);
	}

	private static _hasUserHaveMaxTickets(userId: string): boolean {
		const countOfUserTickets = this._dataBase.getCountOfUserTickets(userId);

		return countOfUserTickets >= ticketsOptions.ticketsLimitForUser;
	}

	private static async _createTemplate(channel: TextChannel, member: GuildMember): Promise<void> {
		const userInteractionInterface = new UserInteractionInterface(channel, 'tickets', member);
		const answers = await userInteractionInterface.getPollResult();

		if (!answers) return;

		const message = await channel.send({ embeds: [this._createEmbedFromAnswers(answers)], components: [this._createConfirmButtons(channel)] });
		this._dataBase.update(channel.id, 'formMessageId', message.id);

		const interaction = await message.awaitMessageComponent().catch(() => { });
		
		if (!interaction) return;

		if (interaction.customId.endsWith('no')) {
			await Util.wait(1000);
			await message.delete();
		
			this._createTemplate(channel, member);
		} else {
			interaction.update({ components: [] });
		}

	}

	private static _createEmbedFromAnswers(answers: UserAnswers): MessageEmbed {
		const embed = new MessageEmbed();
		embed
			.setTitle('Анкета')
			.setColor('PURPLE');

		for (const answer of answers) embed.addField(answer.question, answer.answer, false);

		return embed;
	}

	private static _createConfirmButtons(channel: TextChannel): MessageActionRow {
		const row = new MessageActionRow();

		row.addComponents(
			new MessageButton()
				.setCustomId(`${channel.id}|yes`)
				.setLabel('Всё верно')
				.setStyle('SUCCESS'),
			new MessageButton()
				.setCustomId(`${channel.id}|no`)
				.setLabel('Заполнить заново')
				.setStyle('DANGER')
		);

		return row;
	}

	private _channel!: PrivateChannel<'text'>;
	private _voiceChannel: PrivateChannel<'voice'> | undefined;
	private _message!: Message;
	private _ticketNumber!: number;
	private _database!: TicketsDatabase;
	private _member!: GuildMember;
	private _controlPanel!: ControlPanel;

	constructor(message: Message, member: GuildMember, ticketNumber: number, isNewTicket: boolean = true, voiceChannel?: VoiceChannel) {
		if (!(message && member && ticketNumber) || !(message.channel instanceof TextChannel)) return;

		this._channel = new PrivateChannel('text', message.channel, member);
		this._message = message;
		this._ticketNumber = ticketNumber;
		this._voiceChannel = (voiceChannel ? new PrivateChannel('voice', voiceChannel, member) : undefined);
		this._database = new TicketsDatabase();
		this._member = member;
		this._controlPanel = new ControlPanel(this._message, {
			startCategoryName: 'standart',
			categorys: {
				standart: {
					name: 'standart',
					buttons: {
						close: {
							label: 'Закрыть тикет',
							style: 'DANGER',
							categoryName: 'standart',
							categotyToGo: 'closed',
							eventName: 'close'
						},
						openAdminPanel: {
							label: 'Открыть админ-панель',
							style: 'PRIMARY',
							categoryName: 'standart',
							categotyToGo: 'admin',
							necessaryRoles: ticketsOptions.adminRolesIds
						}
					}
				},
				admin: {
					name: 'admin',
					buttons: {
						remove: {
							label: 'Удалить тикет',
							style: 'DANGER',
							categoryName: 'admin',
							eventName: 'remove',
							necessaryRoles: ticketsOptions.adminRolesIds
						},
						createVoiceChannel: {
							label: 'Создать голосовой канал',
							style: 'PRIMARY',
							categoryName: 'admin',
							eventName: 'createVoiceChannel',
							necessaryRoles: ticketsOptions.adminRolesIds
						},
						openUserPanel: {
							label: 'Открыть узер-панель',
							style: 'PRIMARY',
							categoryName: 'admin',
							categotyToGo: 'standart',
							necessaryRoles: ticketsOptions.adminRolesIds
						}
					}
				},
				closed: {
					name: 'closed',
					buttons: {
						remove: {
							label: 'Удалить тикет',
							style: 'DANGER',
							categoryName: 'closed',
							eventName: 'remove',
							necessaryRoles: ticketsOptions.adminRolesIds
						},
						open: {
							label: 'Открыть тикет',
							style: 'SUCCESS',
							categoryName: 'closed',
							categotyToGo: 'standart',
							eventName: 'open',
							necessaryRoles: ticketsOptions.adminRolesIds
						}
					}
				}
			}
		}, isNewTicket);

		this._controlPanel.on('remove', (member: GuildMember) => (this._onRemove(member)));
		this._controlPanel.on('close', () => (this._onClose()));
		this._controlPanel.on('open', () => (this._onOpen()));
		this._controlPanel.on('createVoiceChannel', () => (this._onCreateVoiceChannel()));
	}

	private async _onRemove(member: GuildMember): Promise<void> {
		const formMessageId = this._database.get(this._channel.channel.id).formMessageId;

		if (formMessageId) await this._removeTicket(member, formMessageId);

		this._database.delete(this._channel.channel.id);
		this._controlPanel.delete();
		this._channel.delete();
		if (this._voiceChannel) this._voiceChannel.delete();
	}

	private async _removeTicket(member: GuildMember, formMessageId: string): Promise<void> {
		const userInteractionInterface = new UserInteractionInterface(this._channel.channel, 'removeTicket', member);
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		const formMessageEmbed = (await this._channel.channel.messages.fetch(formMessageId)).embeds[0];
		formMessageEmbed.fields.push({ name: 'Решение администрации:', value: (answers[0].answer == 'С вынесением решения' ? answers[1].answer : 'Решение отсутствует'), inline: false });
		formMessageEmbed.fields.push({ name: 'Админ:', value: member.user.tag, inline: false });
		formMessageEmbed.footer = { text: `Игрок: ${this._member.user.tag}`, iconURL: Util.getUserAvatarURL(this._member.user) };
		formMessageEmbed.title = `Тикет ${this._ticketNumber}`;

		await this._sendLogMessage(formMessageEmbed);
	}

	private async _sendLogMessage(embed: MessageEmbed): Promise<void> {
		const channel = await this._message.client.channels.fetch(ticketsOptions.logsChannel);
		if (!(channel instanceof TextChannel)) return;
		channel.send({ embeds: [embed] });
	}

	private _onClose(): void {
		this._channel.close();
		if (this._voiceChannel) this._voiceChannel.close();
	}

	private _onOpen(): void {
		this._channel.open();
		if (this._voiceChannel) this._voiceChannel.open();
	}

	private async _onCreateVoiceChannel(): Promise<void> {
		if (this._voiceChannel) return;

		const channel = await PrivateChannel.createChannel('voice', `Войс ${this._ticketNumber}`, this._member, ticketsOptions.ticketsCategory)
		if (channel.type !== 'voice') return
		this._voiceChannel = channel;
		this._voiceChannel.channel.setPosition(this._channel.channel.position + 1);

		this._database.update(this._channel.channel.id, 'voiceChannelId', this._voiceChannel.channel.id);
	}
}