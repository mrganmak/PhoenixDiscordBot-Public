export default class StringBuilder {
	private _strings: Array<string>;
	private _joinSymbol: string;
	private _appendLineSymbol: string;
	private _firstValue: string | undefined;

	constructor(value?: string, options: IStringBuilderOptions = {}) {
		this._strings = new Array();
		this._joinSymbol = options.joinSymbol || '';
		this._appendLineSymbol = (options.appendLineSymbol == '\r\n' || options.appendLineSymbol == '\n') ? options.appendLineSymbol : '\n';
		
		if (value) {
			this._strings.push(value);

			if (options.saveFirstValue) this._firstValue = value;
		}
	}

	public append(value: string) {
		this._strings.push(value);
	}
	
	public appendLine(value: string = '') {
		this._strings.push(this._appendLineSymbol + value);
	}

	public clear() {
		this._strings = new Array();

		if (this._firstValue) this._strings.push(this._firstValue);
	}

	public toString(value?: string): string {
		const joinSymbol = value || this._joinSymbol;

		return this._strings.join(joinSymbol);
	}
}

interface IStringBuilderOptions {
	joinSymbol?: string;
	appendLineSymbol?: string;
	saveFirstValue?: boolean;
}