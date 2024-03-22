import * as request from "request"
import * as ws from "ws"
import * as event from "events"
import { APIMessage as Message, APIEmbed as APIEmbed, APIEmbedAuthor, APIEmbedImage, APIEmbedVideo, APIEmbedField, APIEmbedFooter, APIEmbedProvider, APIEmbedThumbnail, EmbedType, APIMessage, RESTPostAPIChannelMessageJSONBody, GatewayDispatchPayload, GatewayReceivePayload, GatewayReadyDispatch, GatewayReadyDispatchData, GatewayGuildCreateDispatchData, APIChannel, Snowflake, APIGuildMember, GatewayMessageCreateDispatchData, RESTPatchAPIGuildChannelPositionsJSONBody, RESTPatchAPIChannelJSONBody, APIGuild, APIApplicationCommand, ApplicationCommandType, GatewayInteractionCreateDispatchData, InteractionResponseType, APIModalInteractionResponseCallbackData } from "discord-api-types/v10"

export class Client {
    private intents: number
    private token: string
    private socket: ws
    private heartBeat: NodeJS.Timer
    private sessionId: string
    private resumeGatewayUrl: string
    private nowSequence: number
    private op11Time: Date
    private op10Time: Date
    private channels: APIChannel[] = []
    private members: { [guildId: Snowflake]: APIGuildMember[] } = {}
    private guildsCount: number = 0;
    private guilds: string[] = [];
    public applicationId: string
    public discordEventsList: { readonly Error: { readonly on: (callback: (payload: Error) => any) => void; readonly emit: (arg1: Error) => void }; readonly MessageCreate: { readonly on: (callback: (payload: GatewayMessageCreateDispatchData) => any) => void; readonly emit: (arg1: GatewayMessageCreateDispatchData) => void }; readonly Ready: { readonly on: (callback: (payload: GatewayReadyDispatchData) => any) => void; readonly emit: (arg1: GatewayReadyDispatchData) => void }; readonly GuildCreate: { readonly on: (callback: (payload: GatewayGuildCreateDispatchData) => any) => void; readonly emit: (arg1: GatewayGuildCreateDispatchData) => void }; readonly InteractionCreate: { readonly on: (callback: (payload: GatewayInteractionCreateDispatchData) => any) => void; readonly emit: (arg1: GatewayInteractionCreateDispatchData) => void } }

    constructor(token: string, intents: number[]) {
        this.intents = intents.reduce((sum, element) => sum + element, 0);
        this.token = token;
        const events = new event
        this.discordEventsList = {
            Error: {
                on: (callback: (payload: Error) => any) => {
                    events.on("ERROR", callback)
                },
                emit: (arg1: Error) => {
                    events.emit("ERROR", arg1)
                }
            },
            MessageCreate: {

                on: (callback: (payload: GatewayMessageCreateDispatchData) => any) => {
                    events.on("MESSAGE_CREATE", callback)
                },
                emit: (arg1: GatewayMessageCreateDispatchData) => {
                    events.emit("MESSAGE_CREATE", arg1)
                }
            },
            Ready: {
                on: (callback: (payload: GatewayReadyDispatchData) => any) => {
                    events.on("READY", callback)
                },
                emit: (arg1: GatewayReadyDispatchData) => {
                    events.emit("READY", arg1)
                }
            },
            GuildCreate: {
                on: (callback: (payload: GatewayGuildCreateDispatchData) => any) => {
                    events.on("GUILD_CREATE", callback)
                },
                emit: (arg1: GatewayGuildCreateDispatchData) => {
                    events.emit("GUILD_CREATE", arg1)
                }
            },
            InteractionCreate: {
                on: (callback: (payload: GatewayInteractionCreateDispatchData) => any) => {
                    events.on("INTERACTION_CREATE", callback)
                },
                emit: (arg1: GatewayInteractionCreateDispatchData) => {
                    events.emit("INTERACTION_CREATE", arg1)
                }
            }
        } as const
    }
    connect(url: string = "wss://gateway.discord.gg/?v=10&encoding=json", resume: boolean = false) {
        this.socket = new ws(url);
        this.socket.addEventListener("error", (ev) => {
            this.discordEventsList.Error.emit(new Error(ev.message))
            this.resume()
        })
        if (resume) {
            this.socket.once("open", () => {
                this.socket.send(`{"op": 6,"d": {"token": "${this.token}","session_id": "${this.sessionId}","seq": ${this.nowSequence}}}`)
            })
        }
        this.socket.on("message", (data: string, _bin) => {
            const jsonData = JSON.parse(data)
            this.nowSequence = jsonData.s
            if (jsonData.op == 10) {
                if (!resume) {
                    this.socket.send(`{"op": 2,"d": {"token": "${this.token}","intents": ${this.intents},"properties": {"os": "linux","browser": "@bdsx/discord-connector","device": "@bdsx/discord-connector"}}}`)
                }
                this.heartBeat = setInterval(() => {
                    if (this.socket.readyState === ws.OPEN) {
                        this.socket.send(`{ "op": 1, "d": ${this.nowSequence == undefined ? "null" : String(this.nowSequence)} }`)
                        this.op10Time = new Date();
                        setTimeout(() => {
                            if (this.op11Time === undefined || this.op11Time.getTime() < this.op10Time.getTime()) {
                                this.resume()
                            }
                        }, 3000);
                    } else {
                        this.resume()
                    }
                }, jsonData.d.heartbeat_interval)
            }
            if (jsonData.op == 0) {
                switch (jsonData.t) {
                    case eventsNames.MessageCreate: {
                        const data: GatewayMessageCreateDispatchData = jsonData.d
                        this.discordEventsList.MessageCreate.emit(data)
                        break;
                    }
                    case eventsNames.Ready: {
                        const data: GatewayReadyDispatchData = jsonData.d
                        this.applicationId = data.application.id
                        this.guildsCount = data.guilds.length
                        for (let guild of data.guilds) {
                            this.guilds.push(guild.id)
                            request({
                                url: `https://discord.com/api/guilds/${guild.id}/channels`,
                                method: "GET",
                                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                            }, (er, _res, body: string) => {
                                if (!er) {
                                    const data: APIChannel[] = JSON.parse(body)
                                    this.channels.push(...data)
                                }
                                this.guildsCount -= 1
                                if (this.guildsCount == 0) {
                                    this.discordEventsList.Ready.emit(data)
                                }
                            })
                                .on("error", (e: Error) => {
                                })
                        }
                        this.resumeGatewayUrl = data.resume_gateway_url
                        this.sessionId = data.session_id
                        break;
                    }
                    case eventsNames.GuildCreate: {
                        const data: GatewayGuildCreateDispatchData = jsonData.d
                        this.channels.push(...data.channels)
                        if (this.members[data.id] == undefined) {
                            this.members[data.id] = []
                        }
                        this.members[data.id].push(...data.members)
                        this.discordEventsList.GuildCreate.emit(data)
                        break;
                    }
                    case eventsNames.InteractionCreate: {
                        const data: GatewayInteractionCreateDispatchData = jsonData.d
                        this.discordEventsList.InteractionCreate.emit(data)
                        break;
                    }
                }
            } else if (jsonData.op == 9) {
                this.disconnect()
                this.connect()
            } else if (jsonData.op == 11) {
                this.op11Time = new Date()
            }
        })
    }
    disconnect() {
        clearInterval(this.heartBeat as NodeJS.Timeout)
        this.socket.removeAllListeners()
        this.socket.close()
    }
    getChannel(id: string): Channel | undefined {
        for (let channel of this.channels) {
            if (channel.id == id) return new Channel(channel, this.token)
        }
        return undefined
    }
    getMember(guildId: string, userId: string): APIGuildMember | undefined {
        if (guildId in this.members) {
            for (let member of this.members[guildId]) {
                if (member.user?.id == userId) return member
            }
            return undefined
        } else return undefined
    }
    getGuild(guildId: string): Promise<Guild | undefined> {
        return new Promise(r => {
            if (!this.guilds.includes(guildId)) return r(undefined)
            request({
                url: `https://discord.com/api/guilds/${guildId}`,
                method: "GET",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
            }, (er, _res, body: string) => {
                if (!er) {
                    const data: APIGuild = JSON.parse(body)
                    r(new Guild(this, data, this.token))
                }
            })
                .on("error", (e: Error) => {
                    r(undefined)
                })
        })
    }
    private resume() {
        this.socket.removeAllListeners()
        this.socket.close()
        clearInterval(this.heartBeat as NodeJS.Timeout)
        this.connect(this.resumeGatewayUrl, true)
    }
}
export class Intents {
    GUILDS: number
    GUILD_MEMBERS: number
    GUILD_MODERATION: number
    GUILD_EMOJIS_AND_STICKERS: number
    GUILD_INTEGRATIONS: number
    GUILD_WEBHOOK: number
    GUILD_WEBHOOKS: number
    GUILD_INVITES: number
    GUILD_VOICE_STATE: number
    GUILD_VOICE_STATES: number
    GUILD_PRESENCES: number
    GUILD_MESSAGES: number
    GUILD_MESSAGE_REACTIONS: number
    GUILD_MESSAGE_TYPING: number
    DIRECT_MESSAGES: number
    DIRECT_MESSAGE_REACTIONS: number
    DIRECT_MESSAGE_TYPING: number
    MESSAGE_CONTENT: number
    GUILD_SCHEDULED_EVENTS: number
    AUTO_MODERATION_CONFIGURATION: number
    AUTO_MODERATION_EXECUTION: number
    AllIntents: number
    constructor() {
        this.GUILDS = 1 << 0;
        this.GUILD_MEMBERS = 1 << 1;
        this.GUILD_MODERATION = 1 << 2;
        this.GUILD_EMOJIS_AND_STICKERS = 1 << 3;
        this.GUILD_INTEGRATIONS = 1 << 4;
        this.GUILD_WEBHOOKS = 1 << 5;
        this.GUILD_INVITES = 1 << 6;
        this.GUILD_VOICE_STATES = 1 << 7;
        this.GUILD_PRESENCES = 1 << 8;
        this.GUILD_MESSAGES = 1 << 9;
        this.GUILD_MESSAGE_REACTIONS = 1 << 10;
        this.GUILD_MESSAGE_TYPING = 1 << 11;
        this.DIRECT_MESSAGES = 1 << 12;
        this.DIRECT_MESSAGE_REACTIONS = 1 << 13;
        this.DIRECT_MESSAGE_TYPING = 1 << 14;
        this.MESSAGE_CONTENT = 1 << 15;
        this.GUILD_SCHEDULED_EVENTS = 1 << 16;
        this.AUTO_MODERATION_CONFIGURATION = 1 << 20;
        this.AUTO_MODERATION_EXECUTION = 1 << 21;

        this.AllIntents = this.GUILDS + this.GUILD_MEMBERS + this.GUILD_MODERATION + this.GUILD_EMOJIS_AND_STICKERS + this.GUILD_INTEGRATIONS + this.GUILD_WEBHOOKS + this.GUILD_INVITES + this.GUILD_VOICE_STATES + this.GUILD_PRESENCES + this.GUILD_MESSAGES + this.GUILD_MESSAGE_REACTIONS + this.GUILD_MESSAGE_TYPING + this.DIRECT_MESSAGES + this.DIRECT_MESSAGE_REACTIONS + this.DIRECT_MESSAGE_TYPING + this.MESSAGE_CONTENT + this.GUILD_SCHEDULED_EVENTS + this.AUTO_MODERATION_CONFIGURATION + this.AUTO_MODERATION_EXECUTION

    }
}
export enum eventsNames {
    Ready = "READY",
    MessageCreate = "MESSAGE_CREATE",
    GuildCreate = "GUILD_CREATE",
    InteractionCreate = "INTERACTION_CREATE"
}


export class EmbedBuilder {
    private author?: APIEmbedAuthor | undefined
    private title?: string | undefined
    private color?: number | undefined
    private image?: APIEmbedImage | undefined
    private video?: APIEmbedVideo | undefined
    private fields?: APIEmbedField[] | undefined
    private footer?: APIEmbedFooter | undefined
    private provider?: APIEmbedProvider | undefined
    private thumbnail?: APIEmbedThumbnail | undefined
    private timestamp?: string | undefined
    private type?: EmbedType | undefined
    private description?: string | undefined
    private url?: string | undefined
    setUrl(url: string): EmbedBuilder {
        this.url = url;
        return this;
    }
    setDescription(description: string): EmbedBuilder {
        this.description = description
        return this;
    }
    setType(typeInfo: EmbedType): EmbedBuilder {
        this.type = typeInfo;
        return this;
    }
    setTimestamp(timestamp: string): EmbedBuilder {
        this.timestamp = timestamp;
        return this;
    }
    setThumbnail(thumbnailInfo: APIEmbedThumbnail): EmbedBuilder {
        this.thumbnail = thumbnailInfo;
        return this;
    }
    setProvider(providerInfo: APIEmbedProvider): EmbedBuilder {
        this.provider = providerInfo;
        return this;
    }
    setTitle(title: string): EmbedBuilder {
        this.title = title;
        return this;
    }
    setColor(color: number): EmbedBuilder {
        this.color = color
        return this;
    }
    setAuthor(authorInfo: APIEmbedAuthor): EmbedBuilder {
        this.author = authorInfo
        return this;
    }
    setImage(imageInfo: APIEmbedImage): EmbedBuilder {
        this.image = imageInfo
        return this;
    }
    setVideo(videoInfo: APIEmbedVideo): EmbedBuilder {
        this.video = videoInfo
        return this;
    }
    setFields(fieldsInfo: APIEmbedField[]): EmbedBuilder {
        this.fields = fieldsInfo
        return this;
    }
    setFooter(footerInfo: APIEmbedFooter): EmbedBuilder {
        this.footer = footerInfo
        return this;
    }
}
class Channel {
    public info: APIChannel
    private token: string
    constructor(Base: APIChannel, token: string) {
        this.info = Base
        this.token = token
    }
    sendMessage(message: RESTPostAPIChannelMessageJSONBody): Promise<Message> {
        return new Promise((resolve, reject) => {
            request({
                url: `https://discord.com/api/channels/${this.info.id}/messages`,
                method: "POST",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                body: JSON.stringify(message)
            }, (er, _res, body: string) => {
                if (!er) {
                    const data: Message = JSON.parse(body)
                    resolve(data)
                }
            })
                .on("error", (e: Error) => {
                    reject(e)
                })
        })
    }
    changeTopic(description: string): Promise<APIChannel> {
        return new Promise((resolve, reject) => {
            const data: RESTPatchAPIChannelJSONBody = {
                topic: description
            }
            request({
                url: `https://discord.com/api/channels/${this.info.id}`,
                method: "PATCH",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                body: JSON.stringify(data)
            }, (er, _res, body: string) => {
                if (!er) {
                    const data: APIChannel = JSON.parse(body)
                    resolve(data)
                }
            })
                .on("error", (e: Error) => {
                    reject(e)
                })
        })
    }
    deleteMessage(messageId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            request({
                url: `https://discord.com/api//channels/${this.info.id}/messages/${messageId}`,
                method: "DELETE",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
            }, (er, _res, body: string) => {
                if (!er) {
                    resolve()
                }
            })
                .on("error", (e: Error) => {
                    reject(e)
                })
        })
    }
}

export class Guild {
    public info: APIGuild
    private token: string
    private client: Client
    constructor(Client: Client, Base: APIGuild, token: string) {
        this.info = Base;
        this.token = token;
        this.client = Client;
    }

    registerSlashCommand(command: APIApplicationCommand) {
        if (command.type !== 1) throw new TypeError("registerSlashCommand() can only register slash command.")
        request({
            url: `https://discord.com/api/v10/applications/${this.client.applicationId}/guilds/${this.info.id}/commands`,
            method: "POST",
            headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
            body: JSON.stringify(command)
        }, (err, res, body) => {
        })
    }
    static response(content: RESTPostAPIChannelMessageJSONBody, interactionId: string, token: string) {
        request({
            url: `https://discord.com/api/v10/interactions/${interactionId}/${token}/callback`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: 4, data: content })
        }, (er, _res, body: string) => {
        })
    }
}
