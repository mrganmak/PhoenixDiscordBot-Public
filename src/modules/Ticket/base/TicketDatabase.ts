import * as fs from 'fs';

import { Snowflake } from "discord-api-types";
import path = require('path/posix');

export default class TicketsDatabase {
	private static _exemplar: TicketsDatabase

	private _base!: Database

	constructor() {
		if (TicketsDatabase._exemplar) return TicketsDatabase._exemplar;
		TicketsDatabase._exemplar = this;

		const base = JSON.parse(String(fs.readFileSync(path.join(__dirname, './base.json'))));
		this._base = base;
	}

	public get(id: Snowflake): TicketInfo {
		return this._base.tickets[id];
	}

	public getCountOfUserTickets(id: Snowflake) {
		return this._base.users[id];
	}

	public getAll(): Array<TicketInfo> {
		return Object.values(this._base.tickets);
	}

	public add(ticketInfo: TicketInfo): void {
		this._base.tickets[ticketInfo.channelId] = ticketInfo;
		this._base.users[ticketInfo.userId] = (this._base.users[ticketInfo.userId] ? this._base.users[ticketInfo.userId] + 1 : 1);
		this._save();
	}

	public update<K extends keyof TicketInfo>(id: Snowflake, key: K, value: TicketInfo[K]) {
		if (this._base.tickets[id]) this._base.tickets[id][key] = value;
		this._save();
	}

	public delete(id: Snowflake): void {
		if (!this._base.tickets[id]) return;

		this._base.users[this._base.tickets[id].userId] = (this._base.users[this._base.tickets[id].userId] ? this._base.users[this._base.tickets[id].userId] - 1 : 0);
		delete this._base.tickets[id];
		this._save();
	}

	private _save() {
		fs.writeFileSync(path.join(__dirname, './base.json'), JSON.stringify(this._base, null, 4));
	}
}

interface Database {
	tickets: TicketsList;
	users: UsersList;
}

interface TicketsList {
	[key: string]: TicketInfo;
}

interface UsersList {
	[key: string]: number
}

interface TicketInfo {
	channelId: Snowflake;
	messageId: Snowflake;
	voiceChannelId: Snowflake | undefined;
	userId: Snowflake;
	number: number;
	formMessageId?: Snowflake;
}