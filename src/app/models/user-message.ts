/**
 * Represents an emoji reaction to a message
 */
export interface EmojiReaction {
  /** Name/Identifier of the emoji (e.g. "rocket", "heart") */
  name: string;
  /** ID of the user who reacted */
  user: string;
}

/**
 * Represents a message sent by a user in the chat system
 */
export interface UserMessageInterface {
  type: string;
  /** ID of the message author */
  authorId: string;
  username: string;
  authorPhoto: any;
  photoURL: string;
  /** ID of the channel where the message was sent */
  channelId: number;
  directUserId?: string;
  /** Array of comment IDs associated with this message */
  comments: number[];
  /** Array of emoji reactions to this message */
  emojis: EmojiReaction[] | string[]; // Unterstützt beide Formate
  /** Content of the message */
  message: string;
  /** Timestamp of when the message was sent */
  time: number;
  /** Unique identifier for the user message */
  userMessageId: string;
  isOwnMessage: boolean;
}

/**
 * Represents the structure of a message when rendered in the UI
 */
export interface renderMessageInterface {
  /** Message timestamp */
  timestamp: number;
  /** Author information */
  author: any;
  /** Author Photo URL */
  authorPhoto: any;
  /** Unique message identifier */
  userMessageId: string;
  /** Message content */
  message: string;
  emojis: EmojiReaction[] | string[]; // Unterstützt beide Formate
  /** Hour component of the message time */
  hours: number;
  isOwnMessage: boolean;
  /** Minute component of the message time */
  minutes: number;
}

/**
 * Type guard to check if emoji array is of type EmojiReaction[]
 */
export function isEmojiReactionArray(emojis: any[]): emojis is EmojiReaction[] {
  return (
    emojis.length === 0 ||
    (emojis[0] && 'name' in emojis[0] && 'user' in emojis[0])
  );
}
