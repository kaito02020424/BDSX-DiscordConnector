"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guild = exports.Channel = exports.EmbedBuilder = exports.eventsNames = exports.Intents = exports.Client = void 0;
const request = require("request");
const ws = require("ws");
const event = require("events");
class Client {
    constructor(token, intents) {
        this.channels = [];
        this.members = {};
        this.guildsCount = 0;
        this.guilds = [];
        this.intents = intents.reduce((sum, element) => sum + element, 0);
        this.token = token;
        const events = new event;
        this.discordEventsList = {
            Error: {
                on: (callback) => {
                    events.on("ERROR", callback);
                },
                emit: (arg1) => {
                    events.emit("ERROR", arg1);
                }
            },
            MessageCreate: {
                on: (callback) => {
                    events.on("MESSAGE_CREATE", callback);
                },
                emit: (arg1) => {
                    events.emit("MESSAGE_CREATE", arg1);
                }
            },
            Ready: {
                on: (callback) => {
                    events.on("READY", callback);
                },
                emit: (arg1) => {
                    events.emit("READY", arg1);
                }
            },
            GuildCreate: {
                on: (callback) => {
                    events.on("GUILD_CREATE", callback);
                },
                emit: (arg1) => {
                    events.emit("GUILD_CREATE", arg1);
                }
            },
            InteractionCreate: {
                on: (callback) => {
                    events.on("INTERACTION_CREATE", callback);
                },
                emit: (arg1) => {
                    events.emit("INTERACTION_CREATE", arg1);
                }
            }
        };
    }
    connect(url = "wss://gateway.discord.gg/?v=10&encoding=json", resume = false) {
        this.socket = new ws(url);
        this.socket.addEventListener("error", (ev) => {
            this.discordEventsList.Error.emit(new Error(ev.message));
            this.resume();
        });
        if (resume) {
            this.socket.once("open", () => {
                this.socket.send(`{"op": 6,"d": {"token": "${this.token}","session_id": "${this.sessionId}","seq": ${this.nowSequence}}}`);
            });
        }
        this.socket.on("message", (data, _bin) => {
            const jsonData = JSON.parse(data);
            this.nowSequence = jsonData.s;
            if (jsonData.op == 10) {
                if (!resume) {
                    this.socket.send(`{"op": 2,"d": {"token": "${this.token}","intents": ${this.intents},"properties": {"os": "linux","browser": "@bdsx/discord-connector","device": "@bdsx/discord-connector"}}}`);
                }
                this.heartBeat = setInterval(() => {
                    if (this.socket.readyState === ws.OPEN) {
                        this.socket.send(`{ "op": 1, "d": ${this.nowSequence == undefined ? "null" : String(this.nowSequence)} }`);
                        this.op10Time = new Date();
                        setTimeout(() => {
                            if (this.op11Time === undefined || this.op11Time.getTime() < this.op10Time.getTime()) {
                                this.resume();
                            }
                        }, 3000);
                    }
                    else {
                        this.resume();
                    }
                }, jsonData.d.heartbeat_interval);
            }
            if (jsonData.op == 0) {
                switch (jsonData.t) {
                    case eventsNames.MessageCreate: {
                        const data = jsonData.d;
                        this.discordEventsList.MessageCreate.emit(data);
                        break;
                    }
                    case eventsNames.Ready: {
                        const data = jsonData.d;
                        this.applicationId = data.application.id;
                        this.guildsCount = data.guilds.length;
                        for (let guild of data.guilds) {
                            this.guilds.push(guild.id);
                            request({
                                url: `https://discord.com/api/guilds/${guild.id}/channels`,
                                method: "GET",
                                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                            }, (er, _res, body) => {
                                if (!er) {
                                    const data = JSON.parse(body);
                                    this.channels.push(...data);
                                }
                                this.guildsCount -= 1;
                                if (this.guildsCount == 0) {
                                    this.discordEventsList.Ready.emit(data);
                                }
                            })
                                .on("error", (e) => {
                            });
                        }
                        this.resumeGatewayUrl = data.resume_gateway_url;
                        this.sessionId = data.session_id;
                        break;
                    }
                    case eventsNames.GuildCreate: {
                        const data = jsonData.d;
                        this.channels.push(...data.channels);
                        if (this.members[data.id] == undefined) {
                            this.members[data.id] = [];
                        }
                        this.members[data.id].push(...data.members);
                        this.discordEventsList.GuildCreate.emit(data);
                        break;
                    }
                    case eventsNames.InteractionCreate: {
                        const data = jsonData.d;
                        this.discordEventsList.InteractionCreate.emit(data);
                        break;
                    }
                }
            }
            else if (jsonData.op == 9) {
                this.disconnect();
                this.connect();
            }
            else if (jsonData.op == 11) {
                this.op11Time = new Date();
            }
        });
    }
    disconnect() {
        clearInterval(this.heartBeat);
        this.socket.removeAllListeners();
        this.socket.close();
    }
    getChannel(id) {
        for (let channel of this.channels) {
            if (channel.id == id)
                return new Channel(channel, this.token);
        }
        return undefined;
    }
    getMember(guildId, userId) {
        var _a;
        if (guildId in this.members) {
            for (let member of this.members[guildId]) {
                if (((_a = member.user) === null || _a === void 0 ? void 0 : _a.id) == userId)
                    return member;
            }
            return undefined;
        }
        else
            return undefined;
    }
    getGuild(guildId) {
        return new Promise(r => {
            if (!this.guilds.includes(guildId))
                return r(undefined);
            request({
                url: `https://discord.com/api/guilds/${guildId}`,
                method: "GET",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
            }, (er, _res, body) => {
                if (!er) {
                    const data = JSON.parse(body);
                    r(new Guild(this, data, this.token));
                }
            })
                .on("error", (e) => {
                r(undefined);
            });
        });
    }
    resume() {
        this.socket.removeAllListeners();
        this.socket.close();
        clearInterval(this.heartBeat);
        this.connect(this.resumeGatewayUrl, true);
    }
}
exports.Client = Client;
class Intents {
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
        this.AllIntents = this.GUILDS + this.GUILD_MEMBERS + this.GUILD_MODERATION + this.GUILD_EMOJIS_AND_STICKERS + this.GUILD_INTEGRATIONS + this.GUILD_WEBHOOKS + this.GUILD_INVITES + this.GUILD_VOICE_STATES + this.GUILD_PRESENCES + this.GUILD_MESSAGES + this.GUILD_MESSAGE_REACTIONS + this.GUILD_MESSAGE_TYPING + this.DIRECT_MESSAGES + this.DIRECT_MESSAGE_REACTIONS + this.DIRECT_MESSAGE_TYPING + this.MESSAGE_CONTENT + this.GUILD_SCHEDULED_EVENTS + this.AUTO_MODERATION_CONFIGURATION + this.AUTO_MODERATION_EXECUTION;
    }
}
exports.Intents = Intents;
var eventsNames;
(function (eventsNames) {
    eventsNames["Ready"] = "READY";
    eventsNames["MessageCreate"] = "MESSAGE_CREATE";
    eventsNames["GuildCreate"] = "GUILD_CREATE";
    eventsNames["InteractionCreate"] = "INTERACTION_CREATE";
})(eventsNames || (exports.eventsNames = eventsNames = {}));
class EmbedBuilder {
    setUrl(url) {
        this.url = url;
        return this;
    }
    setDescription(description) {
        this.description = description;
        return this;
    }
    setType(typeInfo) {
        this.type = typeInfo;
        return this;
    }
    setTimestamp(timestamp) {
        this.timestamp = timestamp;
        return this;
    }
    setThumbnail(thumbnailInfo) {
        this.thumbnail = thumbnailInfo;
        return this;
    }
    setProvider(providerInfo) {
        this.provider = providerInfo;
        return this;
    }
    setTitle(title) {
        this.title = title;
        return this;
    }
    setColor(color) {
        this.color = color;
        return this;
    }
    setAuthor(authorInfo) {
        this.author = authorInfo;
        return this;
    }
    setImage(imageInfo) {
        this.image = imageInfo;
        return this;
    }
    setVideo(videoInfo) {
        this.video = videoInfo;
        return this;
    }
    setFields(fieldsInfo) {
        this.fields = fieldsInfo;
        return this;
    }
    setFooter(footerInfo) {
        this.footer = footerInfo;
        return this;
    }
}
exports.EmbedBuilder = EmbedBuilder;
class Channel {
    constructor(Base, token) {
        this.info = Base;
        this.token = token;
    }
    sendMessage(message) {
        return new Promise((resolve, reject) => {
            request({
                url: `https://discord.com/api/channels/${this.info.id}/messages`,
                method: "POST",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                body: JSON.stringify(message)
            }, (er, _res, body) => {
                if (!er) {
                    const data = JSON.parse(body);
                    resolve(data);
                }
            })
                .on("error", (e) => {
                reject(e);
            });
        });
    }
    changeTopic(description) {
        return new Promise((resolve, reject) => {
            const data = {
                topic: description
            };
            request({
                url: `https://discord.com/api/channels/${this.info.id}`,
                method: "PATCH",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                body: JSON.stringify(data)
            }, (er, _res, body) => {
                if (!er) {
                    const data = JSON.parse(body);
                    resolve(data);
                }
            })
                .on("error", (e) => {
                reject(e);
            });
        });
    }
    deleteMessage(messageId) {
        return new Promise((resolve, reject) => {
            request({
                url: `https://discord.com/api//channels/${this.info.id}/messages/${messageId}`,
                method: "DELETE",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
            }, (er, _res, body) => {
                if (!er) {
                    resolve();
                }
            })
                .on("error", (e) => {
                reject(e);
            });
        });
    }
}
exports.Channel = Channel;
class Guild {
    constructor(Client, Base, token) {
        this.info = Base;
        this.token = token;
        this.client = Client;
    }
    registerSlashCommand(command) {
        return new Promise((resolve, reject) => {
            if (command.type !== 1)
                return reject("registerSlashCommand() can only register slash command.");
            request({
                url: `https://discord.com/api/v10/applications/${this.client.applicationId}/guilds/${this.info.id}/commands`,
                method: "POST",
                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                body: JSON.stringify(command)
            }, (err, res, body) => {
                if (res.statusCode.toString().startsWith("2"))
                    return resolve();
                if (res.statusCode === 400)
                    return reject(JSON.parse(body));
                if (JSON.parse(body).retry_after != undefined)
                    setTimeout(async () => {
                        resolve(await this.registerSlashCommand(command));
                    }, (JSON.parse(body).retry_after + 1) * 1000);
            });
        });
    }
    static response(content, interactionId, token) {
        return new Promise(resolve => {
            request({
                url: `https://discord.com/api/v10/interactions/${interactionId}/${token}/callback`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: 4, data: content })
            }, (er, _res, body) => {
                resolve();
            });
        });
    }
    static autocomplete(content, interactionId, token) {
        return new Promise(resolve => {
            request({
                url: `https://discord.com/api/v10/interactions/${interactionId}/${token}/callback`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: 8, data: content })
            }, (er, _res, body) => {
                resolve();
            });
        });
    }
}
exports.Guild = Guild;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBa0M7QUFDbEMseUJBQXdCO0FBQ3hCLGdDQUErQjtBQUcvQixNQUFhLE1BQU07SUFpQmYsWUFBWSxLQUFhLEVBQUUsT0FBaUI7UUFQcEMsYUFBUSxHQUFpQixFQUFFLENBQUE7UUFDM0IsWUFBTyxHQUErQyxFQUFFLENBQUE7UUFDeEQsZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDeEIsV0FBTSxHQUFhLEVBQUUsQ0FBQztRQUsxQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLE1BQU0sTUFBTSxHQUFHLElBQUksS0FBSyxDQUFBO1FBQ3hCLElBQUksQ0FBQyxpQkFBaUIsR0FBRztZQUNyQixLQUFLLEVBQUU7Z0JBQ0gsRUFBRSxFQUFFLENBQUMsUUFBaUMsRUFBRSxFQUFFO29CQUN0QyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtnQkFDaEMsQ0FBQztnQkFDRCxJQUFJLEVBQUUsQ0FBQyxJQUFXLEVBQUUsRUFBRTtvQkFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQzlCLENBQUM7YUFDSjtZQUNELGFBQWEsRUFBRTtnQkFFWCxFQUFFLEVBQUUsQ0FBQyxRQUE0RCxFQUFFLEVBQUU7b0JBQ2pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUE7Z0JBQ3pDLENBQUM7Z0JBQ0QsSUFBSSxFQUFFLENBQUMsSUFBc0MsRUFBRSxFQUFFO29CQUM3QyxNQUFNLENBQUMsSUFBSSxD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