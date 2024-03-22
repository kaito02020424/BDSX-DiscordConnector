"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guild = exports.EmbedBuilder = exports.eventsNames = exports.Intents = exports.Client = void 0;
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
                    resolve();
                if (JSON.parse(body).retry_after != undefined)
                    setTimeout(async () => {
                        resolve(await this.registerSlashCommand(command));
                    }, (JSON.parse(body).retry_after + 1) * 1000);
            });
        });
    }
    static response(content, interactionId, token) {
        request({
            url: `https://discord.com/api/v10/interactions/${interactionId}/${token}/callback`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: 4, data: content })
        }, (er, _res, body) => {
        });
    }
}
exports.Guild = Guild;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBa0M7QUFDbEMseUJBQXdCO0FBQ3hCLGdDQUErQjtBQUcvQixNQUFhLE1BQU07SUFpQmYsWUFBWSxLQUFhLEVBQUUsT0FBaUI7UUFQcEMsYUFBUSxHQUFpQixFQUFFLENBQUE7UUFDM0IsWUFBTyxHQUErQyxFQUFFLENBQUE7UUFDeEQsZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDeEIsV0FBTSxHQUFhLEVBQUUsQ0FBQztRQUsxQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLE1BQU0sTUFBTSxHQUFHLElBQUksS0FBSyxDQUFBO1FBQ3hCLElBQUksQ0FBQyxpQkFBaUIsR0FBRztZQUNyQixLQUFLLEVBQUU7Z0JBQ0gsRUFBRSxFQUFFLENBQUMsUUFBaUMsRUFBRSxFQUFFO29CQUN0QyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtnQkFDaEMsQ0FBQztnQkFDRCxJQUFJLEVBQUUsQ0FBQyxJQUFXLEVBQUUsRUFBRTtvQkFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQzlCLENBQUM7YUFDSjtZQUNELGFBQWEsRUFBRTtnQkFFWCxFQUFFLEVBQUUsQ0FBQyxRQUE0RCxFQUFFLEVBQUU7b0JBQ2pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUE7Z0JBQ3pDLENBQUM7Z0JBQ0QsSUFBSSxFQUFFLENBQUMsSUFBc0MsRUFBRSxFQUFFO29CQUM3QyxNQUFNLENBQUMsSUFBSSxD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