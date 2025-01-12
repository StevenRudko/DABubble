export interface UserMessageInterface {
    userMessageId: string;
    channelId: number;
    authorId: string;
    time: number;
    message: string;
    comments: number[];
    emojis: string[];
}
