import { Client } from "discord.js";
import path = require("path/posix");
import * as fs from 'fs';

export default class Collectors {
	private _client: Client;

	constructor(client: Client) {
		this._client = client

		this._startCollectors();
	}

	private async _startCollectors() {
		const dirPath: string = path.join(__dirname, './collectors_list');

		const files = fs.readdirSync(dirPath);

		for (const file of files) {
			if (!file.endsWith('.js')) continue;

			const collectorPath = path.join(dirPath, file);
			const startCollector = await this._getCollectorFromModule(collectorPath);

			startCollector(this._client);
		}
	}

	private async _getCollectorFromModule(collectorPath: string): Promise<(client: Client) => void> {
		const module = await import(collectorPath);
		const collector: (client: Client) => void = module.default;

		return collector;
	}
}