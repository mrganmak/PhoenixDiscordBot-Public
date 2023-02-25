import { Snowflake } from 'discord.js';
import { RolesDatabase } from './base/RolesDatabase';

export class RolesSystem {
	private static _dataBase: RolesDatabase = new RolesDatabase();

	public static hasUserHaveAccesForRole(userId: Snowflake, roleId: Snowflake): boolean {
		const roleOwner = this._dataBase.get(roleId);

		return (!roleOwner ? false : roleOwner == userId);
	}

	public static getUserAccesRoleIds(userId: Snowflake): Array<Snowflake> {
		const roles: Array<Snowflake> = [];

		for (const [roleId, ownerId] of this._dataBase.getAll()) {
			if (ownerId == userId) roles.push(roleId);
		}

		return roles;
	}

	public static getRoleOwner(roleId: Snowflake): Snowflake | undefined {
		return this._dataBase.get(roleId);
	}

	public static addRole(roleId: Snowflake, userId: Snowflake): void {
		this._dataBase.add({ id: roleId, owner: userId });
	}

	public static changeRoleOwner(roleId: Snowflake, userId: Snowflake): void {
		this._dataBase.update(roleId, userId);
	}
}