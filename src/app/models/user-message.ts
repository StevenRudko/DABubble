export interface UserMessageInterface {
    userMessageId: string;
    channelId: number;
    authorId: string;
    author: string;
    time: number;
    message: string;
    comments: number[];
    emojis: string[];
}

export interface renderMessageInterface {
    timestamp: number;
    userMessageId: string;
    author: string;
    message: string;
    hours: number;
    minutes: number;
}