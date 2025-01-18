/**
 * Represents a chat channel in the system
 */
export interface Channel {
  /** Unique identifier for the channel */
  id: string;
  /** Name of the channel */
  name: string;
  /** Channel description */
  description: string;
  /** Map of member IDs to their membership status */
  members: { [key: string]: boolean };
  /** Channel creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Represents a member in a chat channel
 */
export interface ChatMember {
  /** Unique identifier for the member */
  uid: string;
  /** Display name of the member */
  displayName: string | null;
  /** URL to member's profile photo */
  photoURL: string | null;
  /** Member's email address */
  email: string | null;
  /** Online status of the member */
  online?: boolean;
  /** Member's role in the channel */
  role?: string;
}

/**
 * Represents a user for direct messaging
 */
export interface DirectUser {
  /** Unique identifier for the user */
  uid: string;
  /** Display name of the user */
  displayName: string | null;
  /** URL to user's profile photo */
  photoURL: string | null;
  /** User's email address */
  email: string | null;
  /** Online status of the user */
  online?: boolean;
}

/**
 * Represents a message in the chat system
 */
export interface UserMessage {
  /** Unique identifier for the message */
  id: string;
  /** Message content */
  message: string;
  /** ID of the message author */
  authorId: string;
  /** Optional channel ID for channel messages */
  channelId?: string;
  /** Optional user ID for direct messages */
  directUserId?: string;
  /** Timestamp of the message */
  time: {
    /** Seconds component of the timestamp */
    seconds: number;
    /** Nanoseconds component of the timestamp */
    nanoseconds: number;
  };
  /** Numeric message identifier */
  userMessageId: number;
}
