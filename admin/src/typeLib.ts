export enum status {
    ACTIVE,
    ADMIN_NEW,
    USER_NEW,
    RESOLVED,
    ARCHIVED
}

export interface ITicketHeadData {
    _id: string;
    status: status;
    date: number;
    lastEvent: number;
    subject: string;
    admin: string;
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

export interface IServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
    updateHeaders: () => void;
  }
  
 export interface IClientToServerEvents {
    hello: () => void;
    whoami: (callback: (id: string) => void) => void;
    headers: (callback: (data: ITicketHeadData[]) => void) => void;
    details: (id: string, callback: (data: ITicketDetailData, owner: string) => void) => void;
    acceptTicket: (id: string) => void
    pushStatus: (data: {id: string, status: status}) => void
    pushMessage: (data: {id: string, message: string}, callback: (data: ITicketDetailData) => void) => void
  }