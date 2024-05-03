/**
 * https://discord.com/developers/docs/resources/channel#message-object-message-flags
 */
export declare enum MessageFlags {
    /**
     * This message has been published to subscribed channels (via Channel Following)
     */
    Crossposted = 1,
    /**
     * This message originated from a message in another channel (via Channel Following)
     */
    IsCrosspost = 2,
    /**
     * Do not include any embeds when serializing this message
     */
    SuppressEmbeds = 4,
    /**
     * The source message for this crosspost has been deleted (via Channel Following)
     */
    SourceMessageDeleted = 8,
    /**
     * This message came from the urgent message system
     */
    Urgent = 16,
    /**
     * This message has an associated thread, which shares its id
     */
    HasThread = 32,
    /**
     * This message is only visible to the user who invoked the Interaction
     */
    Ephemeral = 64,
    /**
     * This message is an Interaction Response and the bot is "thinking"
     */
    Loading = 128,
    /**
     * This message failed to mention some roles and add their members to the thread
     */
    FailedToMentionSomeRolesInThread = 256,
    /**
     * @unstable This message flag is currently not documented by Discord but has a known value which we will try to keep up to date.
     */
    ShouldShowLinkNotDiscordWarning = 1024,
    /**
     * This message will not trigger push and desktop notifications
     */
    SuppressNotifications = 4096,
    /**
     * This message is a voice message
     */
    IsVoiceMessage = 8192
}
/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type
 */
export declare enum InteractionType {
    Ping = 1,
    ApplicationCommand = 2,
    MessageComponent = 3,
    ApplicationCommandAutocomplete = 4,
    ModalSubmit = 5
}
/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type
 */
export declare enum InteractionResponseType {
    /**
     * ACK a `Ping`
     */
    Pong = 1,
    /**
     * Respond to an interaction with a message
     */
    ChannelMessageWithSource = 4,
    /**
     * ACK an interaction and edit to a response later, the user sees a loading state
     */
    DeferredChannelMessageWithSource = 5,
    /**
     * ACK a button interaction and update it to a loading state
     */
    DeferredMessageUpdate = 6,
    /**
     * ACK a button interaction and edit the message to which the button was attached
     */
    UpdateMessage = 7,
    /**
     * For autocomplete interactions
     */
    ApplicationCommandAutocompleteResult = 8,
    /**
     * Respond to an interaction with an modal for a user to fill-out
     */
    Modal = 9,
    /**
     * Respond to an interaction with an upgrade button, only available for apps with monetization enabled
     */
    PremiumRequired = 10
}
/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
 */
export declare enum ApplicationCommandType {
    ChatInput = 1,
    User = 2,
    Message = 3
}
/**
 * https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
 */
export declare enum ApplicationCommandOptionType {
    Subcommand = 1,
    SubcommandGroup = 2,
    String = 3,
    Integer = 4,
    Boolean = 5,
    User = 6,
    Channel = 7,
    Role = 8,
    Mentionable = 9,
    Number = 10,
    Attachment = 11
}
