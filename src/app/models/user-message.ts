export class UserMessage implements UserMessage {
    userMessageId: string;
    channelId: number;
    directUserId: number;
    time: number;
    message: string;
    authorId: number;
    comments: number[];
    emojis: string[];
  
    constructor(obj?: Partial<UserMessage>) {
      this.userMessageId = obj?.userMessageId ?? '123ASDSDS239';
      this.channelId = obj?.channelId ?? 1;
      this.directUserId = obj?.directUserId ?? 1;
      this.time = obj?.time ?? 122232323;
      this.message = obj?.message ?? 'message';
      this.authorId = obj?.authorId ?? 1;
      this.comments = obj?.comments ?? [1, 2];
      this.emojis = obj?.emojis ?? ['rocket', 'smile'];
    }
  }