import { CommandInteraction, DMChannel, GuildMember, Message, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { IPollQuestionSelectMenu } from "../../config";
import { RolesSystem } from "../RolesSystem/RolesSystem";
import { UserInteractionInterface } from "../UserInteractionInterface/UserInteractionInterface";

@Discord()
export class GiveRole {
	@Slash('giverole')
	private async getRole(
		@SlashOption('target', { type: 'USER', description: 'Введите имя пользователя' })
		targetMember: GuildMember,
		interaction: CommandInteraction
	) {
		const userRoles = RolesSystem.getUserAccesRoleIds(interaction.user.id);
		const member = interaction.member;
		if (!(member instanceof GuildMember)) return;

		if (userRoles.length > 1) {
			const selectMenuOptions: IPollQuestionSelectMenu = {
				type: 'selectMenu',
				content: 'Какую роль вы хотите выдать?',
				answers: [],
				severalMeanings: false
			}

			for (const roleId of userRoles) {
				const role = await interaction.guild?.roles.fetch(roleId);

				if (!role) continue;

				selectMenuOptions.answers.push({ content: role.name, value: role.id });
			}

			const message = await interaction.user.send('.').catch(() => { }).then((message) => (setTimeout(() => (message?.delete()), 500)));
			if (!(message instanceof Message)) return interaction.reply({
				content: 'У вас закрыт лс, его нужно открыть',
				ephemeral: true
			});
			const channel = message.channel;
			if (!(channel instanceof DMChannel)) return;

			interaction.reply({
				content: 'Перейдём в лс для выбора роли',
				ephemeral: true
			});
			
			const userInteractionInterface = new UserInteractionInterface(channel, 'custom', member, [selectMenuOptions]);
			const answers = await userInteractionInterface.getPollResult();
			if (!answers || !answers[0].values) return;

			const roleId = answers[0].values[0];

			targetMember.roles.add(roleId).catch(console.error);
		} else if (userRoles.length == 1) {
			const hasRoleGeted = await targetMember.roles.add(userRoles[0]).catch(console.error);

			if (!hasRoleGeted) interaction.reply({
				content: 'Что-то пошло не так, обратитесь к администрации',
				ephemeral: true
			})
			else interaction.reply({
				content: 'Готово!',
				ephemeral: true
			});
		} else {
			return interaction.reply({
				content: 'Вы не являетесь лидером фракции. Если это ошибка, обратитесь к администрации',
				ephemeral: true
			});
		}
	}
}