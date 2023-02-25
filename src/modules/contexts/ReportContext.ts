import { DMChannel, GuildMember, Message, MessageEmbed, TextChannel, UserContextMenuInteraction } from "discord.js";
import { ContextMenu, Discord } from "discordx";
import { channelIds } from "../../config";
import Util from "../../util/Util";
import { UserInteractionInterface } from "../UserInteractionInterface/UserInteractionInterface";

@Discord()
export abstract class ReportContext {
	@ContextMenu("USER", "Пожаловаться")
	private async handler(interaction: UserContextMenuInteraction) {
		interaction.reply({
			content: 'Перейдём в лс',
			ephemeral: true
		});

		const targetUser = interaction.targetUser;
		const message = await interaction.user.send(`Репорт на ${targetUser.username}`).catch(() => { });
		if (!(message instanceof Message)) return;
		const dmChannel = message.channel;

		if (!(dmChannel instanceof DMChannel) || !(interaction.member instanceof GuildMember)) return;

		const userInteractionInterface = new UserInteractionInterface(dmChannel, 'custom', interaction.member, [
			{ type: 'text', content: 'Опишите проблему', isConfirmationRequired: true },
		]);
		
		const answers = await userInteractionInterface.getPollResult();
		if (!answers) return;

		const channel = await interaction.client.channels.fetch(channelIds.logs);
		if (!(channel instanceof TextChannel)) return;

		const embed = new MessageEmbed();
		embed
			.setTitle(`Репорт на ${targetUser.tag}`)
			.setDescription(answers[0].answer)
			.setFooter({ text: interaction.user.username, iconURL: Util.getUserAvatarURL(interaction.user) })
			.setTimestamp(new Date())
			.setColor('ORANGE');

		channel.send({ embeds: [embed] });
	}
}