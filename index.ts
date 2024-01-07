import * as request from "request"
import * as ws from "ws"
import * as event from "events"
import { APIMessage as Message, APIEmbed as APIEmbed, APIEmbedAuthor, APIEmbedImage, APIEmbedVideo, APIEmbedField, APIEmbedFooter, APIEmbedProvider, APIEmbedThumbnail, EmbedType, APIMessage, RESTPostAPIChannelMessageJSONBody, GatewayDispatchPayload, GatewayReceivePayload, GatewayReadyDispatch, GatewayReadyDispatchData, GatewayGuildCreateDispatchData, APIChannel, Snowflake, APIGuildMember, GatewayMessageCreateDispatchData, RESTPatchAPIGuildChannelPositionsJSONBody, RESTPatchAPIChannelJSONBody } from "discord-api-types/v10"

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
    private guilds: number = 0;
    constructor(token: string, intents: number[]) {
        this.intents = intents.reduce((sum, element) => sum + element, 0);
        this.token = token;
    }
    connect(url: string = "wss://gateway.discord.gg/?v=10&encoding=json", resume: boolean = false) {
        this.socket = new ws(url);
        this.socket.addEventListener("error", (ev) => {
            discordEventsList.Error.emit(new Error(ev.message))
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
                        discordEventsList.MessageCreate.emit(data)
                        break;
                    }
                    case eventsNames.Ready: {
                        const data: GatewayReadyDispatchData = jsonData.d
                        this.guilds = data.guilds.length
                        for (let guild of data.guilds) {
                            request({
                                url: `https://discord.com/api/guilds/${guild.id}/channels`,
                                method: "GET",
                                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                            }, (er, _res, body: string) => {
                                if (!er) {
                                    const data: APIChannel[] = JSON.parse(body)
                                    this.channels.push(...data)
                                }
                                this.guilds -= 1
                                if (this.guilds == 0) {
                                    discordEventsList.Ready.emit(data)
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
                        discordEventsList.GuildCreate.emit(data)
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
        clearInterval(this.heartBeat)
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
    private resume() {
        this.socket.removeAllListeners()
        this.socket.close()
        clearInterval(this.heartBeat)
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
    Resumed = "RESUMED",
    Reconnect = "RECONNECT",
    MessageCreate = "MESSAGE_CREATE",
    GuildCreate = "GUILD_CREATE"
}
const events = new event
export const discordEventsList = {
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
    }
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
class Ready {
    v: number
    user: User
    guilds: { id: string, unavailable: boolean }
    session_id: string
    resume_gateway_url: string
    shard?: [number, number]
    application: Application
}
class Application {
    id: string
    name: string
    icon: string | null
    description: string
    rpc_origins?: string[]
    bot_public: boolean
    bot_require_code_grant: boolean
    terms_of_service_url?: string
    privacy_policy_url?: string
    owner?: User
    /** @deprecated  will be removed in Discord Gateway API v11.*/
    summary: string
    verify_key: string
    team: Team[] | null
    guild_id?: string
    primary_sku_id?: string
    slug?: string
    cover_image?: string
    flags?: number
    tags?: string[]
    install_params?: InstallParams
    custom_install_url?: string
    role_connections_verification_url?: string
}
class InstallParams {
    scopes: string[]
    permissions: string
}
class Team {
    icon: string | null
    id: string
    members: TeamMember[]
    name: string
    owner_user_id: string
}
class TeamMember {
    membership_state: number
    permissions: ["*"]
    team_id: string
    user: User
}
class Guild {
    id: string
    name: string
    icon: string | null
    icon_hash?: string | null
    splash: string | null
    discovery_splash: string | null
    owner?: boolean
    owner_id: string
    permissions?: string
    region?: string
    afk_channel_id: string | null
    afk_timeout: number
    widget_enabled?: boolean
    widget_channel_id?: string
    verification_level: number
    default_message_notifications: number
    explicit_content_filter: number
    roles: Role[]
    emojis: Emoji[]
    features: string[]
    mfa_level: number
    application_id: string | null
    system_channel_id: string | null
    system_channel_flags: number
    rules_channel_id: string | null
    max_presences?: number | null
    max_members?: number
    vanity_url_code: string | null
    description: string | null
    banner: string | null
    premium_tier: number
    premium_subscription_count?: number
    preferred_locale: number
    public_updates_channel_id: string | null
    max_video_channel_users?: number
    max_stage_video_channel_users?: number
    approximate_member_count?: number
    approximate_presence_count?: number
    welcome_screen?: WelcomeScreen
    nsfw_level: number
    stickers?: Sticker[]
    premium_progress_bar_enabled: boolean
    safety_alerts_channel_id: string | null
}
class WelcomeScreen {
    description: string
    welcome_channels: WelcomeScreenChannelStructure
}
class Sticker {
    id: string
    pack_id?: string
    name: string
    description: string | null
    tags: string
    asset?: string
    type: number
    format_type: number
    available?: boolean
    guild_id?: string
    user?: User
    sort_value?: number
}
class WelcomeScreenChannelStructure {
    channel_id: string
    description: string
    emoji_id: string | null
    emoji_name: string | null
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
    changeTopic(description: string):Promise<APIChannel> {
        return new Promise((resolve, reject) => {
            const data:RESTPatchAPIChannelJSONBody = {
                topic:description
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
}
class User {
    id: string
    username: string
    discriminator: string
    global_name?: string | null
    avator: string | null
    bot?: boolean
    system?: boolean
    mfa_enabled?: boolean
    banner?: string | null
    accent_color?: number | null
    locale?: string
    verified?: boolean
    email?: string | null
    flags?: number
    premium_type?: number
    public_flags?: number
}
class Role {
    id: string
    name: string
    color: number
    hoist: boolean
    icon?: string | null
    unicode_emoji?: string | null
    position: number
    permissions: string
    managed: boolean
    mentionable: boolean
    tags?: RoleTags
}
class ChannelMention {
    id: string
    guild_id: string
    type: number
    name: string
}
class Attachment {
    id: string
    filename: string
    description: string | null
    content_type: string | null
    size: number
    url: string
    proxy_url: string
    height?: number | null
    width?: number | null
    ephemeral?: boolean
    duration_secs?: number
    waveform?: string
}
class RoleTags {
    bot_id?: string
    integration_id?: string
    premium_subscriber?: null
    subscription_listing_id?: string
    available_for_purchase?: null
    guild_connections?: null
}
class Reaction {
    count: number
    me: boolean
    emoji: Emoji
}
class Emoji {
    id: string | null
    name: string | null
    roles?: Role[]
    user?: User
    require_colons?: boolean
    managed?: boolean
    animated?: boolean
    available?: boolean
}
class MessageActivity {
    type: number
    party_id?: string
}