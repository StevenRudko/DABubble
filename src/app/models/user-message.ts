export interface UserMessageInterface {
    userMessageId: string;
    channelId: number;
    directUserId: number;
    time: number;
    message: string;
    authorId: number;
    comments: number[];
    emojis: string[];
}