import { GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { rolesIds } from "../../config";

export class PrivateChannel<T extends keyof IPrivateChanneltypes> {
	public static async createChannel<T extends keyof IPrivateChanneltypes>(type: T, name: string, member: GuildMember, parent?: string): Promise<PrivateChannel<'text'> | PrivateChannel<'voice'>> {
		if (type == 'text') {
			const channel = await member.guild.channels.create(name, {
				type: 'GUILD_TEXT',
				parent: parent,
				permissionOverwrites: [
					{ id: member.guild.id, deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'] },
					{ id: member.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] },
					{ id: member.client.user?.id ?? '', allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_MESSAGES'] },
					{ id: rolesIds.admin, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
				]
			});

			return new PrivateChannel('text', channel, member);
		} else {
			const channel = await member.guild.channels.create(name, {
				type: 'GUILD_VOICE',
				parent: parent,
				permissionOverwrites: [
					{ id: member.guild.id, deny: ['VIEW_CHANNEL'] },
					{ id: member.id, allow:  ['VIEW_CHANNEL', 'SPEAK'] },
					{ id: member.client.user?.id ?? '', allow:  ['VIEW_CHANNEL', 'SPEAK'] },
					{ id: rolesIds.admin, allow:  ['VIEW_CHANNEL', 'SPEAK'] }
				]
			});

			return new PrivateChannel('voice', channel, member);
		}
	}

	public channel: IPrivateChanneltypes[T];
	public type: T;
	private _member: GuildMember;

	constructor(type: T, channel: IPrivateChanneltypes[T], member: GuildMember) {
		this.channel = channel;
		this.type = type;
		this._member = member;
	}

	public async close(): Promise<void> {
		await this.channel.permissionOverwrites.delete(this._member.id);
	}

	public async open(): Promise<void> {
		await this.channel.permissionOverwrites.create(this._member.id, (this.type == 'text' ? { VIEW_CHANNEL: true, SEND_MESSAGES: true } : { VIEW_CHANNEL: true, SPEAK: true }));
	}

	public async delete(): Promise<void> {
		await this.channel.delete();
	}
}

interface IPrivateChanneltypes {
	voice: VoiceChannel,
	text: TextChannel
}