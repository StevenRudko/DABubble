// src/app/models/chat.interfaces.ts

export interface Channel {
  id: string;
  name: string;
  description: string;
  members: { [key: string]: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMember {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  online?: boolean;
  role?: string;
}

export interface DirectUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  online?: boolean;
}

export interface UserMessage {
  id: string;
  message: string;
  authorId: string;
  channelId?: string;
  directUserId?: string;
  time: {
    seconds: number;
    nanoseconds: number;
  };
  userMessageId: number;
}
