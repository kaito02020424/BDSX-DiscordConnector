/// <reference types="node" />
import * as event from "events";
import { APIMessage as Message, APIEmbedAuthor, APIEmbedImage, APIEmbedVideo, APIEmbedField, APIEmbedFooter, APIEmbedProvider, APIEmbedThumbnail, EmbedType, RESTPostAPIChannelMessageJSONBody, GatewayReadyDispatchData, GatewayGuildCreateDispatchData, APIChannel } from "discord-api-types/v10";
export declare class Client {
    private intents;
    private token;
    private socket;
    private heartBeat;
    private sessionId;
    private resumeGatewayUrl;
    private nowSequence;
    private op11Time;
    private op10Time;
    private channels;
    private members;
    constructor(token: string, intents: number[]);
    connect(url?: string, resume?: boolean): void;
    disconnect(): void;
    getChannel(id: string): Channel | undefined;
    private resume;
}
export declare const discordEvents: event;
export declare class Intents {
    GUILDS: number;
    GUILD_MEMBERS: number;
    GUILD_MODERATION: number;
    GUILD_EMOJIS_AND_STICKERS: number;
    GUILD_INTEGRATIONS: number;
    GUILD_WEBHOOK: number;
    GUILD_WEBHOOKS: number;
    GUILD_INVITES: number;
    GUILD_VOICE_STATE: number;
    GUILD_VOICE_STATES: number;
    GUILD_PRESENCES: number;
    GUILD_MESSAGES: number;
    GUILD_MESSAGE_REACTIONS: number;
    GUILD_MESSAGE_TYPING: number;
    DIRECT_MESSAGES: number;
    DIRECT_MESSAGE_REACTIONS: number;
    DIRECT_MESSAGE_TYPING: number;
    MESSAGE_CONTENT: number;
    GUILD_SCHEDULED_EVENTS: number;
    AUTO_MODERATION_CONFIGURATION: number;
    AUTO_MODERATION_EXECUTION: number;
    AllIntents: number;
    constructor();
}
export declare enum eventsNames {
    Ready = "READY",
    Resumed = "RESUMED",
    Reconnect = "RECONNECT",
    MessageCreate = "MESSAGE_CREATE",
    GuildCreate = "GUILD_CREATE"
}
export declare const discordEventsList: {
    Error: {
        on: (callback: (payload: Error) => any) => void;
        emit: (arg1: Error) => void;
    };
    MessageCreate: {
        on: (callback: (payload: Message) => any) => void;
        emit: (arg1: Message) => void;
    };
    Ready: {
        on: (callback: (payload: GatewayReadyDispatchData) => any) => void;
        emit: (arg1: GatewayReadyDispatchData) => void;
    };
    GuildCreate: {
        on: (callback: (payload: GatewayGuildCreateDispatchData) => any) => void;
        emit: (arg1: GatewayGuildCreateDispatchData) => void;
    };
};
export declare class EmbedBuilder {
    private author?;
    private title?;
    private color?;
    private image?;
    private video?;
    private fields?;
    private footer?;
    private provider?;
    private thumbnail?;
    private timestamp?;
    private type?;
    private description?;
    private url?;
    setUrl(url: string): EmbedBuilder;
    setDescription(description: string): EmbedBuilder;
    setType(typeInfo: EmbedType): EmbedBuilder;
    setTimestamp(timestamp: string): EmbedBuilder;
    setThumbnail(thumbnailInfo: APIEmbedThumbnail): EmbedBuilder;
    setProvider(providerInfo: APIEmbedProvider): EmbedBuilder;
    setTitle(title: string): EmbedBuilder;
    setColor(color: number): EmbedBuilder;
    setAuthor(authorInfo: APIEmbedAuthor): EmbedBuilder;
    setImage(imageInfo: APIEmbedImage): EmbedBuilder;
    setVideo(videoInfo: APIEmbedVideo): EmbedBuilder;
    setFields(fieldsInfo: APIEmbedField[]): EmbedBuilder;
    setFooter(footerInfo: APIEmbedFooter): EmbedBuilder;
}
declare class Channel {
    info: APIChannel;
    private token;
    constructor(Base: APIChannel, token: string);
    sendMessage(message: RESTPostAPIChannelMessageJSONBody): Promise<Message>;
}
export {};
