export enum status {
    ACTIVE,
    ADMIN_NEW,
    USER_NEW,
    RESOLVED,
    ARCHIVED
}

export interface ITicketHeadData {
    id: string;
    status: status;
    date: number;
    lastEvent: number;
    subject: string;
}

export interface ITicketDetailData {
    id: string;
    messages: IMessage[];
}

export interface IMessage {
    date: Date;
    message: string;
    sender: string;
}

export interface IServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
  }
  
 export interface IClientToServerEvents {
    hello: () => void;
    headers: (callback: (e: {data: ITicketHeadData[]}) => void) => void;
    details: (id: string, callback: (e: {data: ITicketDetailData}) => void) => void;
    pushStatus: (data: {id: string, status: status}) => void
    pushMessage: (data: {id: string, message: string}, callback: (e: {data: ITicketDetailData}) => void) => void
  }