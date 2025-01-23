export interface ChannelInterface {
    createdAt: string;
    createdBy: string;
    description: string;
    members: { [key: string]: boolean };
    name:string;
    type:string;
    updatedAt: number;
    channelId: string;
}
