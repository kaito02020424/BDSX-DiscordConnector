"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guild = exports.EmbedBuilder = exports.eventsNames = exports.Intents = exports.Client = void 0;
var request = require("request");
var ws = require("ws");
var event = require("events");
var v10_1 = require("discord-api-types/v10");
var Client = /** @class */ (function () {
    function Client(token, intents) {
        this.channels = [];
        this.members = {};
        this.guildsCount = 0;
        this.guilds = [];
        this.intents = intents.reduce(function (sum, element) { return sum + element; }, 0);
        this.token = token;
        var events = new event;
        this.discordEventsList = {
            Error: {
                on: function (callback) {
                    events.on("ERROR", callback);
                },
                emit: function (arg1) {
                    events.emit("ERROR", arg1);
                }
            },
            MessageCreate: {
                on: function (callback) {
                    events.on("MESSAGE_CREATE", callback);
                },
                emit: function (arg1) {
                    events.emit("MESSAGE_CREATE", arg1);
                }
            },
            Ready: {
                on: function (callback) {
                    events.on("READY", callback);
                },
                emit: function (arg1) {
                    events.emit("READY", arg1);
                }
            },
            GuildCreate: {
                on: function (callback) {
                    events.on("GUILD_CREATE", callback);
                },
                emit: function (arg1) {
                    events.emit("GUILD_CREATE", arg1);
                }
            },
            InteractionCreate: {
                on: function (callback) {
                    events.on("INTERACTION_CREATE", callback);
                },
                emit: function (arg1) {
                    events.emit("INTERACTION_CREATE", arg1);
                }
            }
        };
    }
    Client.prototype.connect = function (url, resume) {
        var _this = this;
        if (url === void 0) { url = "wss://gateway.discord.gg/?v=10&encoding=json"; }
        if (resume === void 0) { resume = false; }
        this.socket = new ws(url);
        this.socket.addEventListener("error", function (ev) {
            _this.discordEventsList.Error.emit(new Error(ev.message));
            _this.resume();
        });
        if (resume) {
            this.socket.once("open", function () {
                _this.socket.send("{\"op\": 6,\"d\": {\"token\": \"".concat(_this.token, "\",\"session_id\": \"").concat(_this.sessionId, "\",\"seq\": ").concat(_this.nowSequence, "}}"));
            });
        }
        this.socket.on("message", function (data, _bin) {
            var _a, _b;
            var jsonData = JSON.parse(data);
            _this.nowSequence = jsonData.s;
            if (jsonData.op == 10) {
                if (!resume) {
                    _this.socket.send("{\"op\": 2,\"d\": {\"token\": \"".concat(_this.token, "\",\"intents\": ").concat(_this.intents, ",\"properties\": {\"os\": \"linux\",\"browser\": \"@bdsx/discord-connector\",\"device\": \"@bdsx/discord-connector\"}}}"));
                }
                _this.heartBeat = setInterval(function () {
                    if (_this.socket.readyState === ws.OPEN) {
                        _this.socket.send("{ \"op\": 1, \"d\": ".concat(_this.nowSequence == undefined ? "null" : String(_this.nowSequence), " }"));
                        _this.op10Time = new Date();
                        setTimeout(function () {
                            if (_this.op11Time === undefined || _this.op11Time.getTime() < _this.op10Time.getTime()) {
                                _this.resume();
                            }
                        }, 3000);
                    }
                    else {
                        _this.resume();
                    }
                }, jsonData.d.heartbeat_interval);
            }
            if (jsonData.op == 0) {
                switch (jsonData.t) {
                    case eventsNames.MessageCreate: {
                        var data_1 = jsonData.d;
                        _this.discordEventsList.MessageCreate.emit(data_1);
                        break;
                    }
                    case eventsNames.Ready: {
                        var data_2 = jsonData.d;
                        _this.applicationId = data_2.application.id;
                        _this.guildsCount = data_2.guilds.length;
                        for (var _i = 0, _c = data_2.guilds; _i < _c.length; _i++) {
                            var guild = _c[_i];
                            _this.guilds.push(guild.id);
                            request({
                                url: "https://discord.com/api/guilds/".concat(guild.id, "/channels"),
                                method: "GET",
                                headers: { Authorization: "Bot ".concat(_this.token), "Content-Type": "application/json" },
                            }, function (er, _res, body) {
                                var _a;
                                if (!er) {
                                    var data_3 = JSON.parse(body);
                                    (_a = _this.channels).push.apply(_a, data_3);
                                }
                                _this.guildsCount -= 1;
                                if (_this.guildsCount == 0) {
                                    _this.discordEventsList.Ready.emit(data_2);
                                }
                            })
                                .on("error", function (e) {
                            });
                        }
                        _this.resumeGatewayUrl = data_2.resume_gateway_url;
                        _this.sessionId = data_2.session_id;
                        break;
                    }
                    case eventsNames.GuildCreate: {
                        var data_4 = jsonData.d;
                        (_a = _this.channels).push.apply(_a, data_4.channels);
                        if (_this.members[data_4.id] == undefined) {
                            _this.members[data_4.id] = [];
                        }
                        (_b = _this.members[data_4.id]).push.apply(_b, data_4.members);
                        _this.discordEventsList.GuildCreate.emit(data_4);
                        break;
                    }
                    case eventsNames.InteractionCreate: {
                        var data_5 = jsonData.d;
                        _this.discordEventsList.InteractionCreate.emit(data_5);
                        break;
                    }
                }
            }
            else if (jsonData.op == 9) {
                _this.disconnect();
                _this.connect();
            }
            else if (jsonData.op == 11) {
                _this.op11Time = new Date();
            }
        });
    };
    Client.prototype.disconnect = function () {
        clearInterval(this.heartBeat);
        this.socket.removeAllListeners();
        this.socket.close();
    };
    Client.prototype.getChannel = function (id) {
        for (var _i = 0, _a = this.channels; _i < _a.length; _i++) {
            var channel = _a[_i];
            if (channel.id == id)
                return new Channel(channel, this.token);
        }
        return undefined;
    };
    Client.prototype.getMember = function (guildId, userId) {
        var _a;
        if (guildId in this.members) {
            for (var _i = 0, _b = this.members[guildId]; _i < _b.length; _i++) {
                var member = _b[_i];
                if (((_a = member.user) === null || _a === void 0 ? void 0 : _a.id) == userId)
                    return member;
            }
            return undefined;
        }
        else
            return undefined;
    };
    Client.prototype.getGuild = function (guildId) {
        var _this = this;
        return new Promise(function (r) {
            if (!_this.guilds.includes(guildId))
                return r(undefined);
            request({
                url: "https://discord.com/api/guilds/".concat(guildId),
                method: "GET",
                headers: { Authorization: "Bot ".concat(_this.token), "Content-Type": "application/json" },
            }, function (er, _res, body) {
                if (!er) {
                    var data = JSON.parse(body);
                    r(new Guild(_this, data, _this.token));
                }
            })
                .on("error", function (e) {
                r(undefined);
            });
        });
    };
    Client.prototype.resume = function () {
        this.socket.removeAllListeners();
        this.socket.close();
        clearInterval(this.heartBeat);
        this.connect(this.resumeGatewayUrl, true);
    };
    return Client;
}());
exports.Client = Client;
var Intents = /** @class */ (function () {
    function Intents() {
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
    return Intents;
}());
exports.Intents = Intents;
var eventsNames;
(function (eventsNames) {
    eventsNames["Ready"] = "READY";
    eventsNames["MessageCreate"] = "MESSAGE_CREATE";
    eventsNames["GuildCreate"] = "GUILD_CREATE";
    eventsNames["InteractionCreate"] = "INTERACTION_CREATE";
})(eventsNames || (exports.eventsNames = eventsNames = {}));
var EmbedBuilder = /** @class */ (function () {
    function EmbedBuilder() {
    }
    EmbedBuilder.prototype.setUrl = function (url) {
        this.url = url;
        return this;
    };
    EmbedBuilder.prototype.setDescription = function (description) {
        this.description = description;
        return this;
    };
    EmbedBuilder.prototype.setType = function (typeInfo) {
        this.type = typeInfo;
        return this;
    };
    EmbedBuilder.prototype.setTimestamp = function (timestamp) {
        this.timestamp = timestamp;
        return this;
    };
    EmbedBuilder.prototype.setThumbnail = function (thumbnailInfo) {
        this.thumbnail = thumbnailInfo;
        return this;
    };
    EmbedBuilder.prototype.setProvider = function (providerInfo) {
        this.provider = providerInfo;
        return this;
    };
    EmbedBuilder.prototype.setTitle = function (title) {
        this.title = title;
        return this;
    };
    EmbedBuilder.prototype.setColor = function (color) {
        this.color = color;
        return this;
    };
    EmbedBuilder.prototype.setAuthor = function (authorInfo) {
        this.author = authorInfo;
        return this;
    };
    EmbedBuilder.prototype.setImage = function (imageInfo) {
        this.image = imageInfo;
        return this;
    };
    EmbedBuilder.prototype.setVideo = function (videoInfo) {
        this.video = videoInfo;
        return this;
    };
    EmbedBuilder.prototype.setFields = function (fieldsInfo) {
        this.fields = fieldsInfo;
        return this;
    };
    EmbedBuilder.prototype.setFooter = function (footerInfo) {
        this.footer = footerInfo;
        return this;
    };
    return EmbedBuilder;
}());
exports.EmbedBuilder = EmbedBuilder;
var Channel = /** @class */ (function () {
    function Channel(Base, token) {
        this.info = Base;
        this.token = token;
    }
    Channel.prototype.sendMessage = function (message) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            request({
                url: "https://discord.com/api/channels/".concat(_this.info.id, "/messages"),
                method: "POST",
                headers: { Authorization: "Bot ".concat(_this.token), "Content-Type": "application/json" },
                body: JSON.stringify(message)
            }, function (er, _res, body) {
                if (!er) {
                    var data = JSON.parse(body);
                    resolve(data);
                }
            })
                .on("error", function (e) {
                reject(e);
            });
        });
    };
    Channel.prototype.changeTopic = function (description) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var data = {
                topic: description
            };
            request({
                url: "https://discord.com/api/channels/".concat(_this.info.id),
                method: "PATCH",
                headers: { Authorization: "Bot ".concat(_this.token), "Content-Type": "application/json" },
                body: JSON.stringify(data)
            }, function (er, _res, body) {
                if (!er) {
                    var data_6 = JSON.parse(body);
                    resolve(data_6);
                }
            })
                .on("error", function (e) {
                reject(e);
            });
        });
    };
    Channel.prototype.deleteMessage = function (messageId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            request({
                url: "https://discord.com/api//channels/".concat(_this.info.id, "/messages/").concat(messageId),
                method: "DELETE",
                headers: { Authorization: "Bot ".concat(_this.token), "Content-Type": "application/json" },
            }, function (er, _res, body) {
                if (!er) {
                    resolve();
                }
            })
                .on("error", function (e) {
                reject(e);
            });
        });
    };
    return Channel;
}());
var Guild = /** @class */ (function () {
    function Guild(Client, Base, token) {
        this.info = Base;
        this.token = token;
        this.client = Client;
    }
    Guild.prototype.registerSlashCommand = function (command) {
        if (command.type !== v10_1.ApplicationCommandType.ChatInput)
            throw new TypeError("registerSlashCommand() can only register slash command.");
        request({
            url: "https://discord.com/api/v10/applications/".concat(this.client.applicationId, "/guilds/").concat(this.info.id, "/commands"),
            method: "POST",
            headers: { Authorization: "Bot ".concat(this.token), "Content-Type": "application/json" },
            body: JSON.stringify(command)
        }, function (err, res, body) {
        });
    };
    Guild.response = function (content, interactionId, token) {
        request({
            url: "https://discord.com/api/v10/interactions/".concat(interactionId, "/").concat(token, "/callback"),
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: v10_1.InteractionResponseType.ChannelMessageWithSource, data: content })
        }, function (er, _res, body) {
        });
    };
    return Guild;
}());
exports.Guild = Guild;
