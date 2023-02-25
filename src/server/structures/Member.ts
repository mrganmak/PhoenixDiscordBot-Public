import { GuildMember } from "discord.js";

export default class Member {
	public id: string;
	public hasAccess: boolean;
	public ban: IBanInfo | undefined;
	public discordInfo: IDiscordInfo | undefined;

	constructor(id: string, hasAcces: boolean, member?: GuildMember, ban?: IBanInfo) {
		this.id = id;
		this.hasAccess = hasAcces;
		this.ban = ban;

		if (member) {
			this.discordInfo = {
				tag: member.user.tag
			}
		}
	}
}

interface IBanInfo {
	reason: string;
	duration: number;
}

interface IDiscordInfo {
	tag: GuildMember['user']['tag'];
}