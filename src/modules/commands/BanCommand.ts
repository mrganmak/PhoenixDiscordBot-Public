import { CommandInteraction, GuildMember, Role, User } from "discord.js";
import { Discord, Permission, Slash, SlashOption } from "discordx";
import { rolesIds } from "../../config";
import BanBase from "../../server/base/BanBase";

const banBase = new BanBase();

@Discord()
export class BanLeader {
	@Slash('ban')
	@Permission(false)
	@Permission({ id: rolesIds.admin, type: 'ROLE', permission: true })
	private async ban(
		@SlashOption('пользователь', { type: 'USER' })
		user: User,
		@SlashOption('продолжительность', { type: 'INTEGER', description: 'Укажите продолжительность (-1 - перманентно)' })
		duration: number,
		@SlashOption('причина', { type: 'STRING', description: 'Укажите причину' })
		reason: string,
		interaction: CommandInteraction
	) {
		banBase.add({ id: user.id, reason: reason ?? 'Причина не указана', duration: (Number(duration) == -1 ? -1 : Number(duration) * 24 * 60 * 60 * 1000), banDate: new Date().getTime() });

		const member = await interaction.guild?.members.fetch(user.id);
		member?.roles.add(rolesIds.ban);
		
		interaction.reply({
			content: 'Пидор в бане',
			ephemeral: true
		});
	}
}