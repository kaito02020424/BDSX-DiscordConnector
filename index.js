"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedBuilder = exports.discordEventsList = exports.eventsNames = exports.Intents = exports.Client = void 0;
const request = require("request");
const ws = require("ws");
const event = require("events");
class Client {
    constructor(token, intents) {
        this.channels = [];
        this.members = {};
        this.guilds = 0;
        this.intents = intents.reduce((sum, element) => sum + element, 0);
        this.token = token;
    }
    connect(url = "wss://gateway.discord.gg/?v=10&encoding=json", resume = false) {
        this.socket = new ws(url);
        this.socket.addEventListener("error", (ev) => {
            exports.discordEventsList.Error.emit(new Error(ev.message));
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
                        exports.discordEventsList.MessageCreate.emit(data);
                        break;
                    }
                    case eventsNames.Ready: {
                        const data = jsonData.d;
                        this.guilds = data.guilds.length;
                        for (let guild of data.guilds) {
                            request({
                                url: `https://discord.com/api/guilds/${guild.id}/channels`,
                                method: "GET",
                                headers: { Authorization: `Bot ${this.token}`, "Content-Type": "application/json" },
                            }, (er, _res, body) => {
                                if (!er) {
                                    const data = JSON.parse(body);
                                    this.channels.push(...data);
                                }
                                this.guilds -= 1;
                                if (this.guilds == 0) {
                                    exports.discordEventsList.Ready.emit(data);
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
                        exports.discordEventsList.GuildCreate.emit(data);
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
    eventsNames["Resumed"] = "RESUMED";
    eventsNames["Reconnect"] = "RECONNECT";
    eventsNames["MessageCreate"] = "MESSAGE_CREATE";
    eventsNames["GuildCreate"] = "GUILD_CREATE";
})(eventsNames || (exports.eventsNames = eventsNames = {}));
const events = new event;
exports.discordEventsList = {
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
    }
};
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
class Ready {
}
class Application {
}
class InstallParams {
}
class Team {
}
class TeamMember {
}
class Guild {
}
class WelcomeScreen {
}
class Sticker {
}
class WelcomeScreenChannelStructure {
}
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
}
class User {
}
class Role {
}
class ChannelMention {
}
class Attachment {
}
class RoleTags {
}
class Reaction {
}
class Emoji {
}
class MessageActivity {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBa0M7QUFDbEMseUJBQXdCO0FBQ3hCLGdDQUErQjtBQUcvQixNQUFhLE1BQU07SUFhZixZQUFZLEtBQWEsRUFBRSxPQUFpQjtRQUhwQyxhQUFRLEdBQWlCLEVBQUUsQ0FBQTtRQUMzQixZQUFPLEdBQStDLEVBQUUsQ0FBQTtRQUN4RCxXQUFNLEdBQVcsQ0FBQyxDQUFDO1FBRXZCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEUsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUNELE9BQU8sQ0FBQyxNQUFjLDhDQUE4QyxFQUFFLFNBQWtCLEtBQUs7UUFDekYsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ3pDLHlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7WUFDbkQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1FBQ2pCLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxNQUFNLEVBQUU7WUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO2dCQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsSUFBSSxDQUFDLEtBQUssb0JBQW9CLElBQUksQ0FBQyxTQUFTLFlBQVksSUFBSSxDQUFDLFdBQVcsSUFB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