export class UserMessageObject {
    id: number = 0;
    time: number = 0;
    message: string = '';
    author: number = 0;
    comments: [] = [];
    emojis: [] = [];


    constructor(obj?: any) {
        this.id = obj ? obj.id : 1;
        this.time = obj ? obj.time : 122232323;
        this.message = obj ? obj.message : 'message';
        this.author = obj ? obj.author : 1;
        this.comments = obj ? obj.comments : 1;
        this.emojis = obj ? obj.emojis : 'rocket';
    }
}

