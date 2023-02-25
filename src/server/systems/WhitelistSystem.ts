import { Client } from "discord.js";
import { serverOptions } from "../../config";
import MembersSystem from "./MembersSystem";

export default class WhitelistSystem {
	private _client: Client;
	private _membersSystem: MembersSystem;

	constructor(client: Client) {
		this._client = client;
		this._membersSystem = new MembersSystem(client);
	}

	public async hasUserWhitelisted(id: string): Promise<boolean> {
		const member = await this._membersSystem.getMember(id);

		return this._membersSystem.hasMemberHaveRole(member, [serverOptions.whitelistedRole]) ?? this._membersSystem.hasMemberHaveRole(member, serverOptions.adminRoles);
	}

	public async deleteUserFromWhitelist(id: string): Promise<void> {
		const member = await this._membersSystem.getMember(id);

		this._membersSystem.deleteRoleFromMember(member, serverOptions.whitelistedRole);
	}
}