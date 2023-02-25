import { Client, GuildMember, Snowflake, TextChannel, User, VoiceChannel } from "discord.js";
import { rolesIds } from "../config";

export default class Util {
	constructor() {
		throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
	}

	static getId(id: string): Snowflake | undefined {
		return (!(id && (id.startsWith('<') && id.endsWith('>')))) ? undefined : (id.search('!') != -1) ? id.slice(3, -1) : id.slice(2, -1);
	}

	static getRandomInRange(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	static wait(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	static getUserAvatarURL(targetUser: User | null): string | undefined {
		return targetUser ? targetUser.avatarURL() || targetUser.defaultAvatarURL : undefined;
	}

	static async hasMemberHaveRole(member: GuildMember, roles: Array<Snowflake> | Snowflake): Promise<boolean> {
		await member.fetch();

		if (typeof roles == 'string') return member.roles.cache.has(roles);

		for (const role of roles) {
			if (member.roles.cache.has(role)) return true;
		}

		return false;
	}

	static checkOnRussian(words: string): boolean {
		const splitedWords = words.split(' ');

		for (const word of splitedWords) {
			if (/^[a-zA-Zа]+$/.test(word)) return false;
		}
		
		return true;
	}
}