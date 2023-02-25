import { ButtonInteraction, EmojiIdentifierResolvable, GuildMember, InteractionCollector, Message, MessageActionRow, MessageButton, MessageButtonStyle, Snowflake } from "discord.js";
import { EventEmitter } from "stream";
import Util from "../../util/Util";

export class ControlPanel extends EventEmitter {
	private _message: Message;
	private _options: IControlPanelOptions;
	private _componentCollector: InteractionCollector<ButtonInteraction>;
	private _buttons!: Buttons;

	constructor(message: Message, options: IControlPanelOptions, isFirstDeclared: boolean = false) {
		super();

		this._message = message;
		this._options = options;

		if (isFirstDeclared) this._changeCategory(this._options.startCategoryName);

		this._componentCollector = this._message.createMessageComponentCollector({ componentType: "BUTTON" });
		this._componentCollector.on('collect', (interaction) => (this._onComponentCollect(interaction)));
	}
	
	get stoped(): boolean {
		return this._componentCollector.ended
	}

	public delete(): void {
		this._componentCollector.stop();
		this.emit('end');
	}

	public lock(): void {
		this._buttons.setDisabled(true);
		this._message.edit({ components: this._buttons.rows });
	}

	public unlock(): void {
		this._buttons.setDisabled(false);
		this._message.edit({ components: this._buttons.rows });
	}

	private _changeCategory(category: string): void {
		this._message.edit({ components: this._createButtons(this._options.categorys[category].buttons)?.rows ?? [] });
	}

	private _createButtons(buttons: IControlPanelButtons): Buttons | undefined {
		if (Object.values(buttons).length <= 0) return;

		const buttonsOfFive = this._getButtonsOfFiveElements(buttons);
		const rows: Array<MessageActionRow> = [];

		for (const currentButtons of buttonsOfFive) {
			const row: MessageActionRow = new MessageActionRow();

			for (const [k, buttonOpts] of Object.entries(currentButtons)) {
				const button = new MessageButton();

				button.setCustomId(`${this._message.id}|${buttonOpts.categoryName}|${k}`).setLabel(buttonOpts.label).setStyle(buttonOpts.style);
				if (buttonOpts.emoji) button.setEmoji(buttonOpts.emoji);

				row.addComponents(button);
			}

			rows.push(row);
		}

		this._buttons = new Buttons(rows);
		return this._buttons;
	}

	private _getButtonsOfFiveElements(buttons: IControlPanelButtons): Array<IControlPanelButtons> {
		const buttonsKeys = Object.keys(buttons);
		const countOfButtons = buttonsKeys.length;

		if (countOfButtons <= 5) return [buttons];

		const buttonsOfFiveElements: Array<IControlPanelButtons> = [];
		for (let i = 0; i < countOfButtons; i++) {
			const indexOfFive = ~~(i/5);
			const key = buttonsKeys[i];

			buttonsOfFiveElements[indexOfFive] = buttonsOfFiveElements[indexOfFive] ?? {};
			buttonsOfFiveElements[indexOfFive][key] = buttons[key];
		}

		return buttonsOfFiveElements;
	}

	private async _onComponentCollect(interaction: ButtonInteraction): Promise<void> {
		if (!(interaction.member instanceof GuildMember)) return;
		interaction.deferUpdate();

		const [_, categoryName, buttonName] = interaction.customId.split('|');
		const button = this._options.categorys[categoryName].buttons[buttonName];

		if (button.necessaryRoles && !(await Util.hasMemberHaveRole(interaction.member, button.necessaryRoles))) {
			this._message.channel.send('У тебя нет прав, чтобы трогать эту кнопку!')
				.then((message) => setTimeout(() => message.delete(), 5000));

		} else {
			if (button.eventName) this.emit(button.eventName, interaction.member);
			if (button.categotyToGo) this._changeCategory(button.categotyToGo);
		}
	}
}

class Buttons {
	private _rows: Array<MessageActionRow>;

	constructor(rows: Array<MessageActionRow>) {
		this._rows = rows;
	}

	get rows(): Array<MessageActionRow> {
		return this._rows;
	}

	public setDisabled(disabled: boolean): void {
		const rows: Array<MessageActionRow> = [];

		for (const currentRow of this._rows) {
			const row: MessageActionRow = new MessageActionRow();

			for (const button of currentRow.components) {
				if (!(button instanceof MessageButton)) continue;
	
				button.setDisabled(disabled);
				row.addComponents(button);
			}

			rows.push(row);
		}
		
		this._rows = rows;
	}
}

export interface IControlPanelOptions {
	startCategoryName: string,
	categorys: IControlPanelCategorys
}

interface IControlPanelCategorys {
	[key: string]: IControlPanelCategory
}

interface IControlPanelCategory {
	name: string,
	buttons: IControlPanelButtons
}

interface IControlPanelButtons {
	[key: string]: IControlPanelButton
}

interface IControlPanelButton {
	label: string,
	style: MessageButtonStyle,
	categoryName: string,
	categotyToGo?: string,
	eventName?: string,
	emoji?: EmojiIdentifierResolvable,
	necessaryRoles?: Array<Snowflake>
}