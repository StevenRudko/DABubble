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
  authorId: string;
  username: string;
  authorPhoto: any;
  photoURL: string;
  channelId: string;
  directUserId?: string;
  comments: string[];
  emojis: EmojiReaction[] | string[];
  message: string;
  time: number;
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
  author: string;
  /** Author Photo URL */
  authorPhoto: string;
  /** Unique message identifier */
  userMessageId: string;
  /** Message content */
  message: string;
  emojis: EmojiReaction[] | string[];
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
