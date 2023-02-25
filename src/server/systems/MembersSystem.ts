import { Client, Guild, GuildMember } from "discord.js";
import { botOptions, guildIds } from "../../config";

export default class MembersSystem {
	private _client: Client;
	private _guild: Guild;

	constructor(client: Client) {
		this._client = client;
		
		const guild = this._client.guilds.cache.get(botOptions.devMode ? guildIds.dev : guildIds.main);
		if (!guild) throw new Error('Guild is undefined');
		this._guild = guild;
	}

	public async hasMemberInGuild(id: string): Promise<boolean> {
		const member = await this._guild.members.fetch(id).catch(() => { });

		if (!(member instanceof GuildMember)) return false;
		else return true;
	}

	public async getMember(id: string): Promise<GuildMember> {
		return (await this._guild.members.fetch(id));
	}

	public hasMemberHaveRole(member: GuildMember, roles: Array<string>): boolean {
		for (const role of roles) {
			if (member.roles.cache.has(role)) return true
		}

		return false;
	}

	public async setNicknameToMember(id: string, nickname: string): Promise<boolean> {
		const member = await this.getMember(id);

		if (!member.manageable) return false;
 
		await member.setNickname(nickname);

		return true;
	}

	public async addRoleToMember(id: string, roleId: string): Promise<void> {
		const member = await this.getMember(id);

		await member.roles.add(roleId);
	}

	public async removeRoleFromMember(id: string, roleId: string): Promise<void> {
		const member = await this.getMember(id);

		await member.roles.remove(roleId);
	}

	public deleteRoleFromMember(member: GuildMember, role: string): void {
		member.roles.remove(role).catch(console.log);
	}
}