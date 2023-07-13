"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedBuilder = exports.discordEventsList = exports.eventsNames = exports.Intents = exports.discordEvents = exports.Client = void 0;
const request = require("request");
const ws = require("ws");
const event = require("events");
class Client {
    constructor(token, intents) {
        this.channels = [];
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
                        this.resumeGatewayUrl = data.resume_gateway_url;
                        this.sessionId = data.session_id;
                        exports.discordEventsList.Ready.emit(data);
                        break;
                    }
                    case eventsNames.GuildCreate: {
                        const data = jsonData.d;
                        for (let channel of data.channels) {
                            this.channels.push(channel);
                        }
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
    resume() {
        this.socket.removeAllListeners();
        this.socket.close();
        clearInterval(this.heartBeat);
        this.connect(this.resumeGatewayUrl, true);
    }
}
exports.Client = Client;
exports.discordEvents = new event;
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
                    console.log(data);
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
/*
const e = new Embed()
    .setAuthor({ name: "a" })
    .setColor(0xff0000)
const c = new Client("OTYxNDM4MDI0MjQ2Mzc4NTU4.GNc7Z2.OVRI0dkdnEvTUiOppc1IA-p2EcIKHlB02SYt4Q", [new Intents().AllIntents])
c.connect()
c.getChannel("886937851114176582").sendMessage({ embeds: [e] })
setTimeout(() => {
    c.disconnect()
}, 5000);
*/ 
