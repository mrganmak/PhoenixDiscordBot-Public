import * as fs from 'fs';

import { Snowflake } from "discord-api-types";
import path = require('path/posix');

export default class BanBase {
	private static _exemplar: BanBase

	private _base!: IDatabase

	constructor() {
		if (BanBase._exemplar) return BanBase._exemplar;
		BanBase._exemplar = this;

		const base = JSON.parse(String(fs.readFileSync(path.join(__dirname, './banBase.json'))));
		this._base = base;
	}

	public get(id: Snowflake): IBanInfo {
		return this._base[id];
	}

	public getAll(): Array<IBanInfo> {
		return Object.values(this._base);
	}

	public add(banInfo: IBanInfo): void {
		this._base[banInfo.id] = banInfo;
		this._save();
	}

	public update<K extends keyof IBanInfo>(id: Snowflake, key: K, value: IBanInfo[K]) {
		if (this._base[id]) this._base[id][key] = value;
		this._save();
	}

	public delete(id: Snowflake): void {
		if (!this._base[id]) return;

		delete this._base[id];
		this._save();
	}

	private _save() {
		fs.writeFileSync(path.join(__dirname, './banBase.json'), JSON.stringify(this._base, null, 4));
	}
}

interface IDatabase {
	[key: string]: IBanInfo
}

export interface IBanInfo {
	banDate: number,
	duration: number,
	id: string,
	reason: string,
}