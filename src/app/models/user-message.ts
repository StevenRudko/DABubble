export interface UserMessageInterface {
  userMessageId: string;
  channelId: number;
  authorId: string;
  time: number;
  message: string;
  comments: number[];
  emojis: string[];
  isOwnMessage: boolean;
  directUserId?: string; // NEU: für Direktnachrichten
}

export interface renderMessageInterface {
  timestamp: number;
  author: any;
  userMessageId: string;
  message: string;
  isOwnMessage: boolean;
  emojis: string[];
  hours: number;
  minutes: number;
}
