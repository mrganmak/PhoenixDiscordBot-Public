import { ButtonInteraction, DMChannel, GuildMember, MessageActionRow, MessageButton, MessageSelectMenu, SelectMenuInteraction, Snowflake, TextChannel } from "discord.js";
import { ChecksType, IEmbedOprions, IPollQuestionButtons, IPollQuestionSelectMenu, IPollQuestionSelectMenuAnswer, IPollQuestionText, poll, PollQuestionsType } from "../../config";
import StringBuilder from "../../util/StringBuilder";
import Util from "../../util/Util";

export class UserInteractionInterface {
	private _channel: TextChannel | DMChannel;
	private _category: string;
	private _customQuestions: Array<PollQuestionsType> | undefined;
	private _member: GuildMember;

	constructor(channel: TextChannel | DMChannel, category: string | 'custom', member: GuildMember, questions?: Array<PollQuestionsType>) {
		this._category = category;
		this._channel = channel;
		this._customQuestions = questions;
		this._member = member;
	}

	public async getPollResult(): Promise<UserAnswers | undefined> {
		const answers = await this._awaitAnswersFromCategory('begin');

		return answers;
	}

	private async _awaitAnswersFromCategory(category: string): Promise<UserAnswers | undefined> {
		const questions: Array<PollQuestionsType> = this._customQuestions ?? poll[this._category][category].questions;
		return await this._awaitAnswerForQuestions(questions);
	}

	private async _awaitAnswerForQuestions(questions: Array<PollQuestionsType>): Promise<UserAnswers | undefined> {
		let userAnswers: UserAnswers = [];

		for (const question of questions) {
			const userAnswer = await this._awaitAnswerForQuestion(question);
			if (!userAnswer) return;
			userAnswers.push(userAnswer);

			if (userAnswer.questions) {
				const answers = await this._awaitAnswerForQuestions(userAnswer.questions);
				if (!answers) return;

				if (answers.length == 1 && !userAnswer.severalMeanings) userAnswer.answer = answers[0].answer;
				else userAnswers = userAnswers.concat(answers);
			}
			if (userAnswer.categorys) {
				for (const category of userAnswer.categorys) {
					const answers = await this._awaitAnswersFromCategory(category);
					if (!answers) return;

					userAnswers = userAnswers.concat(answers);
				}
				break;
			}
		}

		return userAnswers;
	}

	private async _awaitAnswerForQuestion(question: PollQuestionsType): Promise<IUserAnswer | undefined> {
		if (question.type == 'selectMenu') return await this._awaitAnswerForSelectMenu(question);
		if (question.type == 'text') return await this._awaitAnswerForText(question);
		if (question.type == 'buttons') return await this._awaitAnswerForButtons(question);
	}

	private async _awaitAnswerForSelectMenu(question: IPollQuestionSelectMenu): Promise<IUserAnswer | undefined> {
		question = await this._filterSeelctMenuQuestionsByRole(question);
		const message = await this._channel.send({ content: question.content, components: [this._createSelectMenu(question)] });

		const interaction = await message.awaitMessageComponent({ componentType: 'SELECT_MENU', time: 0 }).catch(() => { });		
		if (!(interaction instanceof SelectMenuInteraction)) return;

		const answer = this._getSelectMenuAnswers(question, interaction.values);
		if (question.embedOptions) answer.embedOptions = question.embedOptions;

		const component = interaction.component;
		if (!(component instanceof MessageSelectMenu)) return;

		component.setDisabled().setPlaceholder(answer.answer);
		interaction.update({
			components: [new MessageActionRow().addComponents(component)]
		});
		await Util.wait(1500);
		await message.delete();
		
		return answer;
	}

	private async _filterSeelctMenuQuestionsByRole(question: IPollQuestionSelectMenu): Promise<IPollQuestionSelectMenu> {
		const answers: Array<IPollQuestionSelectMenuAnswer> = [];

		for (const answer of question.answers) {
			if (!answer.necessaryRoles || await Util.hasMemberHaveRole(this._member, answer.necessaryRoles)) answers.push(answer);
		}

		question.answers = answers;

		return question;
	}

	private _createSelectMenu(question: IPollQuestionSelectMenu): MessageActionRow {
		const row = new MessageActionRow();
		const selectMenu = new MessageSelectMenu();

		selectMenu.setCustomId(this._channel.id);
		if (question.severalMeanings) selectMenu.setMinValues(1).setMaxValues(question.maxAnswers || question.answers.length);

		for (const [k, v] of Object.entries(question.answers)) {
			const label = this._replaceFixedExpressions(v.content);

			selectMenu.addOptions({ label, value: k, description: v.description, emoji: v.emoji });
		}

		row.addComponents(selectMenu);

		return row;
	}

	private _replaceFixedExpressions(text: string): string {
		if (text.search('{nickname}') !== -1) text = text.replace('{nickname}', this._member.nickname ?? this._member.user.username);

		return text;
	}

	private _getSelectMenuAnswers(question: IPollQuestionSelectMenu, values: SelectMenuInteraction['values']): IUserAnswer {
		const userAnswer: IUserAnswer = {
			question: question.content,
			severalMeanings: question.severalMeanings,
			answer: '',
		}
		const answers = new StringBuilder();

		for (const k of values) {
			const answer: IPollQuestionSelectMenuAnswer = question.answers[Number(k)];

			answers.append(this._replaceFixedExpressions(answer.content));
			if (answer.category) {
				userAnswer.categorys = userAnswer.categorys || [];
				userAnswer.categorys.push(answer.category);
			}
			if (answer.value !== undefined) {
				userAnswer.values = userAnswer.values || [];
				userAnswer.values.push(answer.value);
			}
			if (answer.questions) {
				userAnswer.questions = userAnswer.questions ?? [];
				userAnswer.questions = userAnswer.questions.concat(answer.questions);
			}
		}

		userAnswer.answer = answers.toString(', ');

		return userAnswer;
	}

	private async _awaitAnswerForText(question: IPollQuestionText): Promise<IUserAnswer | undefined> {
		const message = await this._channel.send(question.content);
		const answer = (await this._channel.awaitMessages({ max: 1, time: 0 })).first();

		if (!answer) return

		await Util.wait(1500);
		await message.delete();
		if (!(this._channel instanceof DMChannel)) await answer.delete();

		if (question.checks) {
			const checkResult = this._checkAnswer(answer.content, question.checks);

			if (checkResult.length > 0) {
				const checkMessage = await this._channel.send(`Ваш ответ не прошёл проверку:\n${checkResult}`);
				setTimeout(() => (checkMessage.delete()), 10000);

				return await this._awaitAnswerForText(question); 
			}
		}

		const userAnswer: IUserAnswer = {
			question: question.content,
			answer: answer.content,
		}
		
		if (question.isConfirmationRequired && !(await this._awaitConfirmation(answer.content))) return await this._awaitAnswerForText(question); 
		else return userAnswer;
	}

	private async _awaitConfirmation(answer: string): Promise<boolean> {
		const question: IPollQuestionButtons = {
			type: 'buttons',
			content: answer,
			buttons: [
				{
					label: 'Верно',
					style: 'SUCCESS'
				},
				{
					label: 'Неверно',
					style: 'DANGER'
				}
			]
		}

		const userAnswer = await this._awaitAnswerForButtons(question);

		return (userAnswer?.answer == 'Верно');
	}

	private _checkAnswer(answer: string, checks: Array<ChecksType>): string {
		let result = '';

		for (const check of checks) {
			if (check == 'RUSSIAN' && !Util.checkOnRussian(answer)) result += '\nОтвет должен быть написан кириллицей (буквами русского алфавита)';
			else if (check.startsWith('MAX_') && !(answer.length <= Number(check.split('_')[1]))) result += `\nОтвет может содеражть максимум ${check.split('_')[1]} символа`;
		}		

		return result;
	}

	private async _awaitAnswerForButtons(question: IPollQuestionButtons): Promise<IUserAnswer | undefined> {
		const message = await this._channel.send({ content: question.content, components: [this._createButtons(question.buttons)] });

		const interaction = await message.awaitMessageComponent({ componentType: 'BUTTON', time: 0 }).catch(() => { });		

		if (!(interaction instanceof ButtonInteraction)) return;

		await Util.wait(1500);
		await message.delete();

		const [_, answer, category] = interaction.customId.split('|');

		const userAnswer: IUserAnswer = {
			question: question.content,
			answer: answer,
		}
		if (category) userAnswer.categorys = [category];

		return userAnswer;
	}
	//TODO: necessaryRoles for buttons
	private _createButtons(buttons: IPollQuestionButtons['buttons']): MessageActionRow {
		const row = new MessageActionRow();

		for (const buttonOpts of buttons) {
			const button = new MessageButton();

			button.setCustomId(`${this._channel.id}|${buttonOpts.value ?? buttonOpts.label}${(buttonOpts.category ? `|${buttonOpts.category}` : '')}`).setLabel(buttonOpts.label).setStyle(buttonOpts.style);
			if (buttonOpts.emoji) button.setEmoji(buttonOpts.emoji);

			row.addComponents(button);
		}

		return row;
	}
}

export type UserAnswers = Array<IUserAnswer>;

export interface IUserAnswer {
	question: string,
	answer: string,
	values?: Array<string>,
	categorys?: Array<string>,
	questions?: Array<PollQuestionsType>,
	severalMeanings?: boolean,
	embedOptions?: IEmbedOprions
}
