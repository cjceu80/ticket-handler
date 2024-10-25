export enum status {
    ACTIVE,
    ADMIN_NEW,
    USER_NEW,
    USER_RESOLVED,
    RESOLVED,
    ARCHIVED
}

export interface ITicketHeadData {
    _id: string;
    status: status;
    date: number;
    last_event: number;
    subject: string;
}

export interface ITicketDetailData {
    _id: string;
    messages: IMessage[];
}

export interface IMessage {
    date: Date;
    message: string;
    sender: string;
    sender_name: string;
}
