export class UserMessage {
    userMessageId: number = 0;
    channelId: number = 0;
    directUserId: number = 0;
    time: number = 0;
    message: string = '';
    authorId: number = 0;
    comments: [] = [];
    emojis: [] = [];

    constructor(obj?: any) {
        this.userMessageId = obj ? obj.id : 1;
        this.channelId = obj ? obj.channelId : 1;
        this.directUserId = obj ? obj.directUserId : 1;
        this.time = obj ? obj.time : 122232323;
        this.message = obj ? obj.message : 'message';
        this.authorId = obj ? obj.authorId : 1;
        this.comments = obj ? obj.comments : 1;
        this.emojis = obj ? obj.emojis : 'rocket';
    }
}

