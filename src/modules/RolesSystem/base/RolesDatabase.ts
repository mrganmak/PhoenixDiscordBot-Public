import * as fs from 'fs';

import { Snowflake } from "discord-api-types";
import path = require('path/posix');


export class RolesDatabase {
	private static _exemplar: RolesDatabase;

	private _base!: Database

	constructor() {
		if (RolesDatabase._exemplar) return RolesDatabase._exemplar;
		RolesDatabase._exemplar = this;

		const base = JSON.parse(String(fs.readFileSync(path.join(__dirname, './base.json'))));
		this._base = base;
	}

	public get(id: Snowflake): Snowflake | undefined {
		return this._base[id];
	}

	public getAll(): [string, string][] {
		return Object.entries(this._base);
	}

	public add(roleInfo: IRoleInfo): void {
		this._base[roleInfo.id] = roleInfo.owner;
		this._save();
	}

	public update(id: Snowflake, owner: Snowflake) {
		if (this._base[id]) this._base[id] = owner;
		this._save();
	}

	public delete(id: Snowflake): void {
		if (!this._base[id]) return;

		delete this._base[id];
		this._save();
	}

	private _save() {
		fs.writeFileSync(path.join(__dirname, './base.json'), JSON.stringify(this._base, null, 4));
	}
}

interface Database {
	[key: string]: Snowflake
}

interface IRoleInfo {
	id: Snowflake,
	owner: Snowflake,
}