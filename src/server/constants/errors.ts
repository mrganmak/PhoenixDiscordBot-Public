export enum ErrorsCodes {
	MEMBER_HAS_NOT_DEFINED = 10001,
	MEMBER_HAS_NOT_WHITELSITED = 10002,
	CHANNEL_DOES_NOT_EXIST = 10003,
	CANT_SEND_MESSAGE_TO_THIS_CHANNEL = 10004,
	CANT_SEND_AN_EMPY_MESSAGE = 10005,
	CANT_SET_AN_EMPY_NICKNAME = 10006,
	ID_HAS_NOT_DEFINED = 10007,
	MISSING_PERMISSIONS = 10008,
	THIS_USER_HAS_ALREADY_BEEN_BANNED = 10009,
	CANT_BAN_THIS_MEMBER = 10010,
	CANT_UNBAN_THIS_MEMBER = 10011,
	THIS_USER_HAS_NOT_BANNED = 10012,
	INVALID_DATA = 20001,
	INVALID_IN_BODY = 20002,
}

export const errorsMessages: IErrorsMessages = {
	[ErrorsCodes.MEMBER_HAS_NOT_DEFINED]: 'Member has not defined',
	[ErrorsCodes.MEMBER_HAS_NOT_WHITELSITED]: 'Member has not whitelisted',
	[ErrorsCodes.CHANNEL_DOES_NOT_EXIST]: 'Channel does not exist',
	[ErrorsCodes.CANT_SEND_MESSAGE_TO_THIS_CHANNEL]: 'Cant send message to this channel',
	[ErrorsCodes.CANT_SEND_AN_EMPY_MESSAGE]: 'Cant send an empty message',
	[ErrorsCodes.CANT_SET_AN_EMPY_NICKNAME]: 'Cant set an empty nickname',
	[ErrorsCodes.ID_HAS_NOT_DEFINED]: 'Id has not defined',
	[ErrorsCodes.THIS_USER_HAS_ALREADY_BEEN_BANNED]: 'This user has already been banned',
	[ErrorsCodes.THIS_USER_HAS_NOT_BANNED]: 'This user has not banned',
	[ErrorsCodes.CANT_BAN_THIS_MEMBER]: 'Cant ban this member',
	[ErrorsCodes.CANT_UNBAN_THIS_MEMBER]: 'Cant unban this member',
	[ErrorsCodes.MISSING_PERMISSIONS]: 'Missing permissions',
	[ErrorsCodes.INVALID_DATA]: 'Invalid data. Probably need to use \'Content-Type\': \'application/json\'',
}

interface IErrorsMessages {
	[key: number]: string,
}