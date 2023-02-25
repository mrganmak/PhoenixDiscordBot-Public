import { Message } from "discord.js";
import { antispamSystemOptions } from "../../../config";

export default class SpamDetector {
	private _blockedWords: Array<string> = antispamSystemOptions.blockedWords;
	private _exclusionWords: Array<string> = antispamSystemOptions.exclusionWords;

	constructor() { }

	public whetherTheMessageContainsSpam(message: Message): boolean {
		for (const allowedWord of this._exclusionWords) {
			if (message.content.search(allowedWord) !== -1) return false;
		}
		for (const blockedWord of this._blockedWords) {
			if (message.content.search(blockedWord) !== -1) return true;
		}
		return false;
	}

	public getSpamWords(message: Message): Array<string> {
		const spamWords = [];

		for (const blockedWord of this._blockedWords) {
			if (message.content.search(blockedWord) !== -1) spamWords.push(blockedWord);
		}

		return spamWords;
	}
}