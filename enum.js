"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationCommandOptionType = exports.ApplicationCommandType = exports.InteractionResponseType = exports.InteractionType = exports.MessageFlags = void 0;
/**
 * https://discord.com/developers/docs/resources/channel#message-object-message-flags
 */
var MessageFlags;
(function (MessageFlags) {
    /**
     * This message has been published to subscribed channels (via Channel Following)
     */
    MessageFlags[MessageFlags["Crossposted"] = 1] = "Crossposted";
    /**
     * This message originated from a message in another channel (via Channel Following)
     */
    MessageFlags[MessageFlags["IsCrosspost"] = 2] = "IsCrosspost";
    /**
     * Do not include any embeds when serializing this message
     */
    MessageFlags[MessageFlags["SuppressEmbeds"] = 4] = "SuppressEmbeds";
    /**
     * The source message for this crosspost has been deleted (via Channel Following)
     */
    MessageFlags[MessageFlags["SourceMessageDeleted"] = 8] = "SourceMessageDeleted";
    /**
     * This message came from the urgent message system
     */
    MessageFlags[MessageFlags["Urgent"] = 16] = "Urgent";
    /**
     * This message has an associated thread, which shares its id
     */
    MessageFlags[MessageFlags["HasThread"] = 32] = "HasThread";
    /**
     * This message is only visible to the user who invoked the Interaction
     */
    MessageFlags[MessageFlags["Ephemeral"] = 64] = "Ephemeral";
    /**
     * This message is an Interaction Response and the bot is "thinking"
     */
    MessageFlags[MessageFlags["Loading"] = 128] = "Loading";
    /**
     * This message failed to mention some roles and add their members to the thread
     */
    MessageFlags[MessageFlags["FailedToMentionSomeRolesInThread"] = 256] = "FailedToMentionSomeRolesInThread";
    /**
     * @unstable This message flag is currently not documented by Discord but has a known value which we will try to keep up to date.
     */
    MessageFlags[MessageFlags["ShouldShowLinkNotDiscordWarning"] = 1024] = "ShouldShowLinkNotDiscordWarning";
    /**
     * This message will not trigger push and desktop notifications
     */
    MessageFlags[MessageFlags["SuppressNotifications"] = 4096] = "SuppressNotifications";
    /**
     * This message is a voice message
     */
    MessageFlags[MessageFlags["IsVoiceMessage"] = 8192] = "IsVoiceMessage";
})(MessageFlags || (exports.MessageFlags = MessageFlags = {}));
/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type
 */
var InteractionType;
(function (InteractionType) {
    InteractionType[InteractionType["Ping"] = 1] = "Ping";
    InteractionType[InteractionType["ApplicationCommand"] = 2] = "ApplicationCommand";
    InteractionType[InteractionType["MessageComponent"] = 3] = "MessageComponent";
    InteractionType[InteractionType["ApplicationCommandAutocomplete"] = 4] = "ApplicationCommandAutocomplete";
    InteractionType[InteractionType["ModalSubmit"] = 5] = "ModalSubmit";
})(InteractionType || (exports.InteractionType = InteractionType = {}));
/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type
 */
var InteractionResponseType;
(function (InteractionResponseType) {
    /**
     * ACK a `Ping`
     */
    InteractionResponseType[InteractionResponseType["Pong"] = 1] = "Pong";
    /**
     * Respond to an interaction with a message
     */
    InteractionResponseType[InteractionResponseType["ChannelMessageWithSource"] = 4] = "ChannelMessageWithSource";
    /**
     * ACK an interaction and edit to a response later, the user sees a loading state
     */
    InteractionResponseType[InteractionResponseType["DeferredChannelMessageWithSource"] = 5] = "DeferredChannelMessageWithSource";
    /**
     * ACK a button interaction and update it to a loading state
     */
    InteractionResponseType[InteractionResponseType["DeferredMessageUpdate"] = 6] = "DeferredMessageUpdate";
    /**
     * ACK a button interaction and edit the message to which the button was attached
     */
    InteractionResponseType[InteractionResponseType["UpdateMessage"] = 7] = "UpdateMessage";
    /**
     * For autocomplete interactions
     */
    InteractionResponseType[InteractionResponseType["ApplicationCommandAutocompleteResult"] = 8] = "ApplicationCommandAutocompleteResult";
    /**
     * Respond to an interaction with an modal for a user to fill-out
     */
    InteractionResponseType[InteractionResponseType["Modal"] = 9] = "Modal";
    /**
     * Respond to an interaction with an upgrade button, only available for apps with monetization enabled
     */
    InteractionResponseType[InteractionResponseType["PremiumRequired"] = 10] = "PremiumRequired";
})(InteractionResponseType || (exports.InteractionResponseType = InteractionResponseType = {}));
/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
 */
var ApplicationCommandType;
(function (ApplicationCommandType) {
    ApplicationCommandType[ApplicationCommandType["ChatInput"] = 1] = "ChatInput";
    ApplicationCommandType[ApplicationCommandType["User"] = 2] = "User";
    ApplicationCommandType[ApplicationCommandType["Message"] = 3] = "Message";
})(ApplicationCommandType || (exports.ApplicationCommandType = ApplicationCommandType = {}));
/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
 */
var ApplicationCommandOptionType;
(function (ApplicationCommandOptionType) {
    ApplicationCommandOptionType[ApplicationCommandOptionType["Subcommand"] = 1] = "Subcommand";
    ApplicationCommandOptionType[ApplicationCommandOptionType["SubcommandGroup"] = 2] = "SubcommandGroup";
    ApplicationCommandOptionType[ApplicationCommandOptionType["String"] = 3] = "String";
    ApplicationCommandOptionType[ApplicationCommandOptionType["Integer"] = 4] = "Integer";
    ApplicationCommandOptionType[ApplicationCommandOptionType["Boolean"] = 5] = "Boolean";
    ApplicationCommandOptionType[ApplicationCommandOptionType["User"] = 6] = "User";
    ApplicationCommandOptionType[ApplicationCommandOptionType["Channel"] = 7] = "Channel";
    ApplicationCommandOptionType[ApplicationCommandOptionType["Role"] = 8] = "Role";
    ApplicationCommandOptionType[ApplicationCommandOptionType["Mentionable"] = 9] = "Mentionable";
    ApplicationCommandOptionType[ApplicationCommandOptionType["Number"] = 10] = "Number";
    ApplicationCommandOptionType[ApplicationCommandOptionType["Attachment"] = 11] = "Attachment";
})(ApplicationCommandOptionType || (exports.ApplicationCommandOptionType = ApplicationCommandOptionType = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVudW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7O0dBRUc7QUFDSCxJQUFZLFlBaURYO0FBakRELFdBQVksWUFBWTtJQUN0Qjs7T0FFRztJQUNILDZEQUFlLENBQUE7SUFDZjs7T0FFRztJQUNILDZEQUFlLENBQUE7SUFDZjs7T0FFRztJQUNILG1FQUFrQixDQUFBO0lBQ2xCOztPQUVHO0lBQ0gsK0VBQXdCLENBQUE7SUFDeEI7O09BRUc7SUFDSCxvREFBVyxDQUFBO0lBQ1g7O09BRUc7SUFDSCwwREFBYyxDQUFBO0lBQ2Q7O09BRUc7SUFDSCwwREFBYyxDQUFBO0lBQ2Q7O09BRUc7SUFDSCx1REFBYSxDQUFBO0lBQ2I7O09BRUc7SUFDSCx5R0FBc0MsQ0FBQTtJQUN0Qzs7T0FFRztJQUNILHdHQUFzQyxDQUFBO0lBQ3RDOztPQUVHO0lBQ0gsb0ZBQTRCLENBQUE7SUFDNUI7O09BRUc7SUFDSCxzRUFBcUIsQ0FBQTtBQUN2QixDQUFDLEVBakRXLFlBQVksNEJBQVosWUFBWSxRQWlEdkI7QUFFRDs7R0FFRztBQUNILElBQVksZUFNWDtBQU5ELFdBQVksZUFBZTtJQUN6QixxREFBUSxDQUFBO0lBQ1IsaUZBQXNCLENBQUE7SUFDdEIsNkVBQW9CLENBQUE7SUFDcEIseUdBQWtDLENBQUE7SUFDbEMsbUVBQWUsQ0FBQTtBQUNqQixDQUFDLEVBTlcsZUFBZSwrQkFBZixlQUFlLFFBTTFCO0FBRUQ7O0dBRUc7QUFDSCxJQUFZLHVCQWlDWDtBQWpDRCxXQUFZLHVCQUF1QjtJQUNqQzs7T0FFRztJQUNILHFFQUFRLENBQUE7SUFDUjs7T0FFRztJQUNILDZHQUE0QixDQUFBO0lBQzVCOztPQUVHO0lBQ0gsNkhBQW9DLENBQUE7SUFDcEM7O09BRUc7SUFDSCx1R0FBeUIsQ0FBQTtJQUN6Qjs7T0FFRztJQUNILHVGQUFpQixDQUFBO0lBQ2pCOztPQUVHO0lBQ0gscUlBQXdDLENBQUE7SUFDeEM7O09BRUc7SUFDSCx1RUFBUyxDQUFBO0lBQ1Q7O09BRUc7SUFDSCw0RkFBb0IsQ0FBQTtBQUN0QixDQUFDLEVBakNXLHVCQUF1Qix1Q0FBdkIsdUJBQXVCLFFBaUNsQztBQUVEOztHQUVHO0FBQ0gsSUFBWSxzQkFJWDtBQUpELFdBQVksc0JBQXNCO0lBQ2hDLDZFQUFhLENBQUE7SUFDYixtRUFBUSxDQUFBO0lBQ1IseUVBQVcsQ0FBQTtBQUNiLENBQUMsRUFKVyxzQkFBc0Isc0NBQXRCLHNCQUFzQixRQUlqQztBQUVEOztHQUVHO0FBQ0gsSUFBWSw0QkFZWDtBQVpELFdBQVksNEJBQTRCO0lBQ3RDLDJGQUFjLENBQUE7SUFDZCxxR0FBbUIsQ0FBQTtJQUNuQixtRkFBVSxDQUFBO0lBQ1YscUZBQVcsQ0FBQTtJQUNYLHFGQUFXLENBQUE7SUFDWCwrRUFBUSxDQUFBO0lBQ1IscUZBQVcsQ0FBQTtJQUNYLCtFQUFRLENBQUE7SUFDUiw2RkFBZSxDQUFBO0lBQ2Ysb0ZBQVcsQ0FBQTtJQUNYLDRGQUFlLENBQUE7QUFDakIsQ0FBQyxFQVpXLDRCQUE0Qiw0Q0FBNUIsNEJBQTRCLFFBWXZDIn0=