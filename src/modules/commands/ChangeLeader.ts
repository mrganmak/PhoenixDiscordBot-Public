import { CommandInteraction, GuildMember, Role, User } from "discord.js";
import { Discord, Permission, Slash, SlashOption } from "discordx";
import { rolesIds } from "../../config";
import { RolesSystem } from "../RolesSystem/RolesSystem";

@Discord()
export class ChangeLeader {
	@Slash('changeleader')
	@Permission(false)
	@Permission({ id: rolesIds.admin, type: 'ROLE', permission: true })
	private async changeLeader(
		@SlashOption('фракиця', { type: 'ROLE' })
		role: Role,
		@SlashOption('глава', { type: 'USER', description: 'Введите имя пользователя' })
		member: GuildMember,
		interaction: CommandInteraction
	) {
		if (!RolesSystem.getRoleOwner(role.id)) RolesSystem.addRole(role.id, member.id)
		else RolesSystem.changeRoleOwner(role.id, member.id);

		interaction.reply({
			content: `${member.nickname ?? member.user.username} теперь может выдавать роль ${role.name}`,
			ephemeral: true
		});
	}
}