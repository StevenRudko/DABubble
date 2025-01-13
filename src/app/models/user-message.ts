export interface UserMessageInterface {
  userMessageId: string;
  channelId: number;
  authorId: string;
  time: number;
  message: string;
  comments: number[];
  emojis: string[];
  directUserId?: string; // NEU: für Direktnachrichten
}

export interface renderMessageInterface {
  timestamp: number;
  author: any;
  userMessageId: string;
  message: string;
  emojis: string[];
  hours: number;
  minutes: number;
}
