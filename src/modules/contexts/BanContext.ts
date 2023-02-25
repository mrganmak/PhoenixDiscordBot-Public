import { DMChannel, GuildMember, Message, UserContextMenuInteraction } from "discord.js";
import { ContextMenu, Discord, Permission } from "discordx";
import { rolesIds } from "../../config";
import BanBase from "../../server/base/BanBase";
import { UserInteractionInterface } from "../UserInteractionInterface/UserInteractionInterface";

const banBase = new BanBase();

@Discord()
export abstract class BanContext {
	@Permission(false)
	@Permission({ id: '630725925746507816', type: 'ROLE', permission: true })
	@ContextMenu("USER", "Забанить")
	private async handler(interaction: UserContextMenuInteraction) {
		interaction.reply({
			content: 'Перейдём в лс',
			ephemeral: true
		});

		const targetUser = interaction.targetUser;
		const message = await interaction.user.send(`Бан ${targetUser.username}`).catch(() => { });
		if (!(message instanceof Message)) return;
		const dmChannel = message.channel;

		if (!(dmChannel instanceof DMChannel) || !(interaction.member instanceof GuildMember)) return;

		const userInteractionInterface = new UserInteractionInterface(dmChannel, 'custom', interaction.member, [
			{ type: 'text', content: 'Укажите продолжительность бана (в днях)', isConfirmationRequired: true },
			{ type: 'text', content: 'Укажите причину бана', isConfirmationRequired: true }
		]);
		
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		banBase.add({ id: targetUser.id, reason: answers[1].answer ?? 'Причина не указана', duration: Number(answers[0].answer) * 24 * 60 * 60 * 1000, banDate: new Date().getTime() });
		const member = await interaction.guild?.members.fetch(targetUser.id);
		member?.roles.add(rolesIds.ban);
	}
}