import { ColorResolvable, EmojiIdentifierResolvable, MessageButtonStyleResolvable, Snowflake } from "discord.js"

export const botOptions = {
	token: 'Token',
	devMode: false,
	updateCommands: true
}

export const guildIds = {
	dev: '598155112153743418',
	main: '509648884532772875'
}

export const rolesIds = {
	admin: (botOptions.devMode ? "630725925746507816" : "509657740361072641"),
	lspd: (botOptions.devMode ? "939640681645871115" : "939975667137781790"),
	sahp: (botOptions.devMode ? "939640681645871115" : "939975759546683432"),
	sheriff: (botOptions.devMode ? "939640681645871115" : "939975781415809094"),
	prosecutor: (botOptions.devMode ? "939640681645871115" : "939976024769318933"),
	whitelisted: '930224211266523146',
	donate: '940372970143092806',
	ban: (botOptions.devMode ? '939889441420505169' : '931973856787304498' ),
	moderator: '630725925746507816'
}

export const channelIds = {
	ideas: '842827208224538685',
	logs: (botOptions.devMode ? '887334411631202335' : '910881599292330035'),
	ban: (botOptions.devMode ? '939890833543557131' : '940043973022613524'),
	ticketsLogs: (botOptions.devMode ? '887334411631202335' : '911736075872002118'),
	ticketsCategory: (botOptions.devMode ? '743692138000416849' : '842465761963540550'),
	court: (botOptions.devMode ? '939880539660374066' : '939990816787669133'),
	camera: (botOptions.devMode ? '887334411631202335' : '940325295611863070'),
	requests: (botOptions.devMode ? '887334411631202335' : '940344939320082452'),
	welcome: (botOptions.devMode ? '887334411631202335' : '814158627438592121'),
	weazel: (botOptions.devMode ? '887334411631202335' : '941347633941856306')
}

export const serverOptions = {
	whitelistedRole: rolesIds.whitelisted,
	adminRoles: [],
	banRole: rolesIds.ban,
	banChannel: channelIds.ban
}

export const antispamSystemOptions = {
	blockedWords: ['glfte.com', 'discord', 'discrd', 'gift'],
	exclusionWords: ['discord.com', 'discord.gg'],
	logsChannelId: channelIds.logs,
	adminRoles: [rolesIds.admin, rolesIds.moderator]
}

export const ticketsOptions = {
	adminRolesIds: [rolesIds.admin],
	ticketsLimitForUser: 3,
	ticketsCategory: channelIds.ticketsCategory,
	logsChannel: channelIds.ticketsLogs
}

export const fractionRequestOptions: IFractionRequestOptions = {
	channels: (botOptions.devMode ? ['939934412001378334'] : ['939976598944362527', '939976817958322257', '939977203444224030', '939980434647961640', '941084951967830077', '942872412666609724']),
	defaultColor: 'PURPLE',
	colors: {
		'939934412001378334': 'BLUE',
		'939976598944362527': 'BLUE',
		'939976817958322257': 'ORANGE',
		'939977203444224030': 'YELLOW',
		'939980434647961640': 'DARK_PURPLE',
		'942872412666609724': 'BLUE'
	}
}

interface IFractionRequestOptions {
	channels: Array<string>,
	defaultColor: ColorResolvable,
	colors: IColors
}

interface IColors {
	[key: string]: ColorResolvable
}

export const poll: IPoll = {
	tickets: {
		begin: {
			questions: [
				{
					type: 'selectMenu',
					content: 'Вопрос какого характера вас интересует?',
					answers: [
						{ content:  'Я хочу получить транспорт, продающийся на заказ', category: 'getVehicle' },
						{ content : 'Другое', category: 'other' }
					],
					severalMeanings: false
				}
			]
		},
		getVehicle: {
			questions: [
				{ type: 'text', content: 'Модель тс', isConfirmationRequired: false },
				{
					type: 'text',
					content: 'Укажите обоснованную причину, по которой вам нужен транспорт. (Просто "хочу" не подойдёт). \nЛибо он вам нужен для рп, либо персонажу по квенте (при этом нужно указать соответствие с квентой или дописать старую)',
					isConfirmationRequired: false,
					checks: ['MAX_1024']
				}
			]
		},

		other: {
			questions: [
				{
					type: 'text',
					content: 'Опишите проблему',
					isConfirmationRequired: false,
					checks: ['MAX_1024']
				}
			]
		},
	},

	removeTicket: {
		begin: {
			questions: [
				{
					type: 'buttons',
					content: 'Как вы хотите удалить тикет?',
					buttons: [
						{
							label: 'С вынесением решения',
							style: 'SECONDARY',
							category: 'solution'
						},
						{
							label: 'Без вынесения решения',
							style: 'SECONDARY'
						}
					]
				}
			]
		},
		solution: {
			questions: [
				{ type: 'text', content: 'Каково ваше решение?', isConfirmationRequired: true }
			]
		}
	},

	lawsuit: {
		begin: {
			questions: [
				{
					type: 'selectMenu',
					content: 'В какой суд вы хотите подать заявление?',
					answers: [
						{
							content: 'Транспортный суд',
							category: 'traffiсСourt',
							description: 'Занимается рассмотрением всех вопросов, связанных с нарушением дорожного кодекс',
							value: 'traffiсСourt',
							emoji: '🚗'
						},
						{
							content: 'Окружной суд первого судебного округа Сан-Андреас',
							category: 'countyCourt',
							description: 'Занимается рассмотрением всех правонарушений, указанных в Penal code',
							value: 'countyCourt',
							emoji: '⚖️',
							necessaryRoles: [rolesIds.lspd, rolesIds.sahp, rolesIds.sheriff, rolesIds.prosecutor]
						},
						{
							content: 'Апелляционный суд первого судебного округа Сан-Андреас',
							category: 'appealCourt',
							description: 'Занимается рассмотрением всех апелляций по делам, вынесенным в окружном суде',
							value: 'appealCourt',
							emoji: '📄'
						},
						{
							content: 'Гражданский суд',
							category: 'citizenCourt',
							description: 'Занимается рассмотрением всех исков гражданского судопроизводства',
							value: 'citizenCourt',
							emoji: '👨‍⚖️'
						}
					],
					severalMeanings: false
				}
			]
		},
		traffiсСourt: {
			questions: [
				{
					type: 'selectMenu',
					content: 'Что вам требуется?',
					answers: [
						{ content: 'Оспорить штраф' },
						{ content: 'Оспорить решение по ДТП' },
						{ content: 'Другое', questions: [{ type: 'text', content: 'Опишите, что вам нужно', isConfirmationRequired: true }] }
					],
					severalMeanings: false
				},
				{
					type: 'text',
					content: 'Опишите суть обращения (что произошло, где произошло и т.д)',
					isConfirmationRequired: true,
					checks: ['MAX_1024']
				}
			]
		},
		countyCourt: {
			questions: [
				{
					type: 'text',
					content: 'Введите имя обвиняемого',
					isConfirmationRequired: true,
				},
				{
					type: 'text',
					content: 'Укажите список обвинений',
					isConfirmationRequired: true
				},
				{
					type: 'text',
					content: 'Прикрепите ссылку на дело, в котором указаны все улики (если такого нет, напишите "отсутствует")',
					isConfirmationRequired: false
				}
			]
		},
		appealCourt: {
			questions: [
				{
					type: 'selectMenu',
					content: 'Истец',
					answers: [
						{ content: '{nickname}' },
						{ content: 'Другое', questions: [{ type: 'text', content: 'Укажиет имя истца', isConfirmationRequired: true }] }
					],
					severalMeanings: false
				},
				{
					type: 'text',
					content: 'Укажите номер дела',
					isConfirmationRequired: false,
				},
				{
					type: 'text',
					content: 'Укажите текст апелляции (можно ссылкой на гугл докс)',
					isConfirmationRequired: false,
					checks: ['MAX_1024']
				}
			]
		},
		citizenCourt: {
			questions: [
				{
					type: 'selectMenu',
					content: 'Истец',
					answers: [
						{ content: '{nickname}' },
						{ content: 'Другое', questions: [{ type: 'text', content: 'Укажиет имя истца', isConfirmationRequired: true }] }
					],
					severalMeanings: false,
					embedOptions: {
						inline: true
					}
				},
				{
					type: 'selectMenu',
					content: 'Ответчик',
					answers: [
						{
							content: 'Полицейский департамент города Лос-Сантос',
							emoji: '👮'
						},
						{
							content: 'Управление шерифа округа Блейн',
							emoji: '🏜️'
						},
						{
							content: 'Дорожный патруль Сан-Андреас',
							emoji: '🚔'
						},
						{
							content: 'Пожарный департамент города Лос-Сантос',
							emoji: '🚒'
						},
						{
							content: 'Пиллбокс-Хилл',
							emoji: '🏥'
						},
						{
							content: 'Другое',
							questions: [{ type: 'text', content: 'Имя ответчика или наименование организации', isConfirmationRequired: true }]
						}
					],
					severalMeanings: false,
					embedOptions: {
						inline: true
					}
				},
				{
					type: 'text',
					content: 'Текст иска (можно ссылкой на гугл докс)',
					isConfirmationRequired: false
				}
			]
		}
	},

	accessRequests: {
		begin: {
			questions: [
				{ type: 'text', content: 'Сколько вам полных лет (ИРЛ)?', isConfirmationRequired: false },
				{ type: 'text', content: 'Ваше имя (по желанию, если не хотите отвечать, напишите "нет")', isConfirmationRequired: false },
				{ type: 'text', content: 'Сколько лет вашему персонажу?', isConfirmationRequired: false },
				{ type: 'text', content: 'Как зовут вашего персонажа?', isConfirmationRequired: false, checks: ['RUSSIAN'] },
				{
					type: 'selectMenu',
					content: 'На какой слот вы хотите пойти?',
					answers: [
						{
							content: 'LSPD',
							emoji: '👮'
						},
						{
							content: 'SAHP',
							emoji: '🚔'
						},
						{
							content: 'Шерифы',
							emoji: '🏜️'
						},
						{
							content: 'Судебная система (адвокат, помощник прокурора)',
							emoji: '👨‍⚖️'
						},
						{
							content: 'Спасатели',
							emoji: '🚒'
						},
						{
							content: 'EMS',
							emoji: '🚑'
						},
						{
							content: 'Цивил',
							emoji: '👨'
						},
						{
							content: 'Крайм',
							emoji: '🔪',
							questions: [{ type: 'text', content: 'Какой крайм вы хотите отыгрывать? Можете указать название банды', isConfirmationRequired: true }]
						},
						{
							content: 'Другое',
							emoji: '⬜',
							questions: [{ type: 'text', content: 'Что конкретно вы хотите отыгрывать?', isConfirmationRequired: true }]
						}
					],
					severalMeanings: false
				},
				{
					type: 'selectMenu',
					content: 'У вашего персонажа есть квента?',
					answers: [
						{
							content: 'Да',
							questions: [{ type: 'text', content: 'Укажите ссылку на квенту', isConfirmationRequired: false }]
						},
						{
							content: 'Нет'
						}
					],
					severalMeanings: false
				}
			]
		}
	}
}

interface IPoll {
	[key: string]: IPollCategorys
}

interface IPollCategorys {
	[key: string]: IPollCategory
}

interface IPollCategory {
	questions: Array<PollQuestionsType>
}

export type PollQuestionsType = IPollQuestionSelectMenu | IPollQuestionText | IPollQuestionButtons;

export interface IPollQuestionSelectMenu {
	type: 'selectMenu',
	content: string,
	answers: Array<IPollQuestionSelectMenuAnswer>,
	severalMeanings: boolean,
	maxAnswers?: number,
	embedOptions?: IEmbedOprions
}

export interface IPollQuestionSelectMenuAnswer {
	content: string,
	description?: string,
	value?: string,
	category?: string,
	questions?: Array<PollQuestionsType>,
	necessaryRoles?: Array<Snowflake>,
	emoji?: EmojiIdentifierResolvable,
}

export interface IEmbedOprions {
	inline: boolean,
}

export interface IPollQuestionText {
	type: 'text',
	content: string,
	isConfirmationRequired: boolean,
	category?: string,
	checks?: Array<ChecksType>
}

export type ChecksType = 'RUSSIAN' | `MAX_${string}`;

export interface IPollQuestionButtons {
	type: 'buttons',
	content: string,
	buttons: Array<IPollQuestionButtonSettings>,
}

export interface IPollQuestionButtonSettings {
	label: string,
	style: MessageButtonStyleResolvable,
	value?: string,
	category?: string,
	emoji?: EmojiIdentifierResolvable,
	necessaryRoles?: Array<Snowflake>
}
