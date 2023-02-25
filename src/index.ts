import "reflect-metadata";
import { Client, Discord, Once } from "discordx";
import { botOptions, channelIds, guildIds, rolesIds, serverOptions } from "./config";
import { Interaction, MessageActionRow, MessageButton, MessageEmbed, TextChannel, User } from "discord.js";
import { importx } from "@discordx/importer";
import { Lawsuit } from "./modules/Lawsuit/Lawsuit";
import BanBase from "./server/base/BanBase";
import Util from "./util/Util";
import { Ticket } from "./modules/Ticket/Ticket";
import { FractionRequest } from "./modules/FractionRequest/FractionRequest";
import Server from "./server/server";
import Collectors from "./modules/Collectors/Collectors";
import { AccessRequest } from "./modules/AccessRequest/AccessRequest";

const client = new Client({
	botId: 'phoenix',
	intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MEMBERS', 'DIRECT_MESSAGES', 'GUILD_BANS', 'GUILD_INVITES'],
	botGuilds: botOptions.devMode ? [guildIds.dev] : [guildIds.main]
});

client.on("interactionCreate", (interaction: Interaction) => {
	client.executeInteraction(interaction);
});

@Discord()
class ApplicationBot {
	@Once('ready')
	private async onReady() {
		console.log(`Connected as ${client.user?.tag}`);

		Lawsuit.parseLawsuits(client);
		Ticket.parseTickets(client);
		FractionRequest.parseRequests(client);
		AccessRequest.parseLawsuits(client);

		new Server(client);
		new Collectors(client);

		const guild = await client.guilds.fetch(botOptions.devMode ? guildIds.dev : guildIds.main);
		await guild.members.fetch();	

		client.user?.setActivity({ type: 'WATCHING', name: 'на Феникс' });

		if (botOptions.updateCommands) {
			await client.clearApplicationCommands();
			await client.initApplicationCommands();
		}

		setInterval(updateThreads, 360000);
		updateThreads();

		setInterval(updateStatus, 3000000);
		updateStatus();
	}
}

client.on('guildMemberRemove', async (member) => {
	const channel = await client.channels.fetch(channelIds.welcome);
	if (!(channel instanceof TextChannel)) return;
	
	const embed = new MessageEmbed();
	embed
		.setTitle(`${member.user.tag} покинул нас :(`)
		.setColor('RED')
		.setFooter({ text: member.nickname || member.user.username, iconURL: Util.getUserAvatarURL(member.user) })
		.setTimestamp(new Date());

	channel.send({ embeds: [embed] });
});

client.on('guildBanAdd', async (ban) => {
	await ban.fetch();

	sendBanMessage(ban.user, -1, ban.reason ?? undefined);	
});

client.on('guildMemberAdd', (member) => {
	const banBase = new BanBase();
	const ban = banBase.get(member.id);

	if (ban && member.manageable) {
		member.roles.add(serverOptions.banRole);
		
		if (ban.duration == -1) return;

		const newDuration = ban.duration + (1 * 24 * 60 * 60 * 1e3);
		banBase.update(member.id, 'duration', newDuration);

		const durationInDays = Math.floor(newDuration / (1000 * 60 * 60 * 24) % 30);
		sendBanMessage(member.user, durationInDays, 'Попытка обойти блокировку', true);
	}
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
	if (oldMember.roles?.cache.has(serverOptions.banRole) && !newMember.roles?.cache.has(serverOptions.banRole)) {
		const banBase = new BanBase();

		banBase.delete(newMember.id);
		sendUnbanMessage(newMember.user);
	} else if (!oldMember.roles?.cache.has(serverOptions.banRole) && newMember.roles?.cache.has(serverOptions.banRole)) {
		const banBase = new BanBase();

		if (!banBase.get(newMember.id)) {
			banBase.add({ id: newMember.id, reason: '', duration: -1, banDate: new Date().getTime() });
			sendBanMessage(newMember.user, -1);
		} else {
			const ban = banBase.get(newMember.id);
			sendBanMessage(newMember.user, Math.floor(ban.duration / (1000 * 60 * 60 * 24) % 30), ban.reason);
		};
	}
});

async function sendBanMessage(user: User, duration: number, reason: string = 'Причина не указана', isProlongation?: boolean): Promise<void> {
	const embed = new MessageEmbed();
	embed
		.setTitle(`${isProlongation ? `Бан ` : ``}${user.tag} ${isProlongation ? `был продлён` : `был забанен`}`)
		.addField('Причина', reason, true)
		.addField('Продолжительность', `${(duration >= 1) ? `${duration} ${((duration >= 10 && duration <= 20) || (duration % 10 >= 5)) ? 'дней': (duration % 10 == 1 ? 'день' : 'дня')}` : (duration == -1 ? 'Перманентно' : '<1 дня')}`, true)
		.setFooter({ text: client.user?.username ?? '', iconURL: Util.getUserAvatarURL(client.user) })
		.setColor('RED')
		.setTimestamp(new Date());

	const channel = await client.channels.fetch(channelIds.ban);
	if (channel instanceof TextChannel) channel.send({ embeds: [embed] });
}

async function sendUnbanMessage(user: User): Promise<void> {
	const embed = new MessageEmbed();
	embed
		.setTitle(`${user.tag} был разбанен`)
		.setFooter({ text: client.user?.username ?? '', iconURL: Util.getUserAvatarURL(client.user) })
		.setColor('GREEN')
		.setTimestamp(new Date());

	const channel = await client.channels.fetch(channelIds.ban);
	if (channel instanceof TextChannel) channel.send({ embeds: [embed] });
}

function updateThreads() {
	client.channels.cache.forEach((channel) => {
		if (!(channel instanceof TextChannel)) return;
		
		unzipThreads(channel);
	});
}

async function unzipThreads(channel: TextChannel) {
	const archived = await channel.threads.fetchArchived().catch(() => { });

	if (!archived) return;

	if (archived.threads.size <= 0) return;

	archived.threads.forEach((thread) => {
		const createdAt = new Date(thread.createdAt);
		const currentDate = new Date();
		const daysLag = Math.ceil(Math.abs(createdAt.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));

		if (daysLag <= 30) thread.setArchived(false);
	});
}

async function updateStatus() {
	const guild = await client.guilds.fetch(guildIds.main);
	const role = await guild.roles.fetch(rolesIds.donate);
	const members = (role?.members ? [...role?.members.values()] : undefined);
	
	if (!members) return;

	const member = members[Util.getRandomInRange(0, members.length - 1)];

	client.user?.setActivity({ type: 'WATCHING', name: `на пожертвование ${member.user.username}` });
}

async function run() {
	await importx(`${__dirname}/modules/{commands,contexts,Ticket,Lawsuit,FractionRequest,AccessRequest}/**.js`);

	await client.login(botOptions.token);
}

run();
