export class UserAuth {
    email: string;
    password: string;
    name: string;

    constructor(obj?: any) {
        this.email = obj ? obj.email : '';
        this.password = obj ? obj.email : '';
        this.name = obj ? obj.name : '';
    }
}