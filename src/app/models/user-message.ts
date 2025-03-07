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
  time:
    | {
        seconds: number;
        nanoseconds: number;
      }
    | number;
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
 * Represents thread information for a message
 */
export interface ThreadInfo {
  /** Number of replies in the thread */
  replyCount: number;
  /** Timestamp of the last reply */
  lastReplyTime?: {
    hours: number;
    minutes: number;
  };
}

/**
 * Interface for a user mention within a text message
 * Tracks both user data and position in the text
 */
export interface MentionedUser {
  /** User ID of mentioned user */
  uid: string;
  /** Username of mentioned user */
  username: string;
  /** Display name of mentioned user, if available */
  displayName: string | null | undefined;
  /** Profile photo URL of mentioned user */
  photoURL: string | null | undefined;
  /** Starting position of mention in text */
  start: number;
  /** Ending position of mention in text */
  end: number;
}

/**
 * Interface for a mention tag used in text input/editing
 * Similar to MentionedUser but with 'id' instead of 'uid'
 */
export interface MentionTag {
  /** User ID of mentioned user */
  id: string;
  /** Username of mentioned user */
  username: string;
  /** Display name of mentioned user, if available */
  displayName: string | null | undefined;
  /** Profile photo URL of mentioned user */
  photoURL: string | null | undefined;
  /** Starting position of mention in text */
  start: number;
  /** Ending position of mention in text */
  end: number;
}
