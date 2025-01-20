/**
 * Represents a message sent by a user in the chat system
 */
export interface UserMessageInterface {
  type: string;
  /** ID of the message author */
  authorId: string;
  username: string;
  photoURL: string;
  /** ID of the channel where the message was sent */
  channelId: number;
  directUserId?: string; // NEU: für Direktnachrichten
  /** Array of comment IDs associated with this message */
  comments: number[];
  /** Array of emoji reactions to this message */
  emojis: string[];
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
  /** Unique message identifier */
  userMessageId: string;
  /** Message content */
  message: string;
  emojis: string[];
  /** Hour component of the message time */
  hours: number;
  isOwnMessage: boolean;
  /** Minute component of the message time */
  minutes: number;
}
