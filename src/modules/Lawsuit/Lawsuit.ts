import * as fs from 'fs';
import { ButtonComponent, Discord } from "discordx";
import { ButtonInteraction, Client, DMChannel, GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import { UserAnswers, UserInteractionInterface } from '../UserInteractionInterface/UserInteractionInterface';
import Util from '../../util/Util';
import { channelIds } from '../../config';
import { ControlPanel } from '../ControlPanel/ControlPanel';

@Discord()
export class Lawsuit {
	private static _lawsuitsCount: number = Number(fs.readFileSync('./counters/lawsuits.txt'));

	@ButtonComponent('sendLawsuit')
	private openTicket(interaction: ButtonInteraction) {
		Lawsuit.createLawsuit(interaction);
	}

	public static async parseLawsuits(client: Client): Promise<void> {
		const channel = await client.channels.fetch(channelIds.court);
		if (!(channel instanceof TextChannel)) return;
		const guild = channel.guild;
		const messages = await channel.messages.fetch();

		for (const message of messages.values()) {
			const embed = message.embeds[0];
			if (!embed || message.components.length <= 0) continue;
			const memberId = embed.footer?.text;
			if (!memberId) continue;

			const member = await guild.members.fetch(memberId);

			new Lawsuit(message, member, false);
		}
	}

	public static async createLawsuit(interaction: ButtonInteraction): Promise<Lawsuit | undefined> {
		interaction.deferUpdate();

		this._lawsuitsCount += 1;

		const member = await interaction.guild?.members.fetch(interaction.user.id);
		if (!member) return;
		const messageInDm = await member.user.send(`Заполните опрос:`).catch(() => { });
		if (!(messageInDm instanceof Message)) return;
		const channel = messageInDm.channel;
		if (!(channel instanceof DMChannel)) return;

		const userInteractionInterface = new UserInteractionInterface(channel, 'lawsuit', member);
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		const embed = this._createEmbed(answers, member);
		if (!embed) return;
		const courtChannel = await member.client.channels.fetch(channelIds.court);
		if (!(courtChannel instanceof TextChannel)) return;
		const message = await courtChannel.send({ embeds: [embed] });

		channel.send(`Номер дела: ${embed.title?.split('#')[1]}`);
		fs.writeFileSync('./counters/lawsuits.txt', String(this._lawsuitsCount));

		return new Lawsuit(message, member);
	}

	public static _createEmbed(answers: UserAnswers, member: GuildMember): MessageEmbed | undefined {
		const courtData = answers[0];
		const courtName = (courtData.values ? courtData.values[0] : 'countyCourt');
		answers = answers.slice(1);

		const lawsuitId = Number(`${this._lawsuitsCount}${new Date().getTime() % 100000}`) % 1000000;
		const lawsuitNumber = `${courtIds[courtName] ?? 'F'}-${lawsuitId}`;

		const embed = new MessageEmbed();
		embed
			.setTitle(`Дело #${lawsuitNumber}`)
			.setColor('GREY')
			.setTimestamp(new Date())
			.setFooter({ text: member.user.id, iconURL: Util.getUserAvatarURL(member.user) })
			.addField('Наименование суда', courtData.answer);

		for (const answer of answers) {
			embed.addField(answer.question, answer.answer, answer.embedOptions?.inline ?? false);
		}

		return embed;
	}

	private _message!: Message;
	private _member!: GuildMember;
	private _embed!: MessageEmbed;
	private _controlPanel!: ControlPanel;

	constructor(message: Message, member: GuildMember, isNewLawsuit: boolean = true) {
		if (!(message && member)) return;

		this._message = message;
		this._member = member;
		this._embed = this._message.embeds[0];
		this._controlPanel = new ControlPanel(this._message, {
			startCategoryName: 'standart',
			categorys: {
				standart: {
					name: 'standart',
					buttons: {
						hearingDate: {
							label: 'Назначить дату слушания',
							style: 'PRIMARY',
							categoryName: 'standart',
							categotyToGo: 'opened',
							eventName: 'hearingDate',
							emoji: '🕰️'
						},
						reject: {
							label: 'Отклонить запрос',
							style: 'DANGER',
							categoryName: 'standart',
							categotyToGo: 'close',
							eventName: 'reject',
							emoji: '⚠️'
						}
					}
				},
				opened: {
					name: 'opened',
					buttons: {
						remove: {
							label: 'Вынести решение',
							style: 'PRIMARY',
							categoryName: 'opened',
							eventName: 'decision',
							categotyToGo: 'close'
						},
						rehearingDate: {
							label: 'Переназначить дату слушания',
							style: 'PRIMARY',
							categoryName: 'opened',
							eventName: 'rehearingDate',
							emoji: '🕰️'
						},
					}
				},
				close: {
					name: 'close',
					buttons: { }
				}
			}
		}, isNewLawsuit);

		this._controlPanel.on('hearingDate', () => (this._hearingDate()));
		this._controlPanel.on('rehearingDate', () => (this._rehearingDate()));
		this._controlPanel.on('reject', () => (this._reject()));
		this._controlPanel.on('decision', () => (this._decision()));
	}

	private async _hearingDate(): Promise<void> {
		const channel = this._message.channel;
		if (!(channel instanceof TextChannel)) return;

		const userInteractionInterface = new UserInteractionInterface(channel, 'custom', this._member, [
			{ type: 'text', content: 'Укажите дату и время слушания (пример: 06.02.2022 в 16:00):', isConfirmationRequired: true }
		]);
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		this._embed.addField('Дата и время слушания', answers[0].answer);
		this._message.edit({ embeds: [this._embed] });
		this._member.user.send(`По делу #${this._embed.title?.split('#')[1]} назначена дата слушания: ${answers[0].answer}`);
	}

	private async _rehearingDate(): Promise<void> {
		const channel = this._message.channel;
		if (!(channel instanceof TextChannel)) return;

		const userInteractionInterface = new UserInteractionInterface(channel, 'custom', this._member, [
			{ type: 'text', content: 'Укажите дату и время слушания (пример: 06.02.2022 в 16:00):', isConfirmationRequired: true }
		]);
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		this._embed.fields[this._embed.fields.length - 1] = { name: 'Дата и время слушания', value: answers[0].answer, inline: false };
		this._message.edit({ embeds: [this._embed] });
		this._member.user.send(`По делу #${this._embed.title?.split('#')[1]} переназначена дата слушания: ${answers[0].answer}`);
	}

	private async _reject(): Promise<void> {
		const channel = this._message.channel;
		if (!(channel instanceof TextChannel)) return;

		const userInteractionInterface = new UserInteractionInterface(channel, 'custom', this._member, [
			{ type: 'text', content: 'Укажите причину отклонения запроса', isConfirmationRequired: true }
		]);
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		this._embed.addField('Запрос отклонён', answers[0].answer);
		this._message.edit({ embeds: [this._embed] });
		this._member.user.send(`Запрос на рассмотрение дела #${this._embed.title?.split('#')[1]} был отклонён \nПричина: ${answers[0].answer}`);
	}

	private async _decision(): Promise<void> {
		const channel = this._message.channel;
		if (!(channel instanceof TextChannel)) return;

		const userInteractionInterface = new UserInteractionInterface(channel, 'custom', this._member, [
			{ type: 'text', content: 'Укажите решение по делу', isConfirmationRequired: true }
		]);
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		this._embed.addField('Решение', answers[0].answer);
		this._message.edit({ embeds: [this._embed] });
		this._member.user.send(`По делу #${this._embed.title?.split('#')[1]} вынесено решение:\n ${answers[0].answer}`);
	}
}

const courtIds: ICourtsIds = {
	'traffiсСourt': 'T',
	'countyCourt': 'D',
	'appealCourt': 'A',
	'citizenCourt': 'C'
}

interface ICourtsIds {
	[key: string]: string
}