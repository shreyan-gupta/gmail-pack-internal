export interface Header {
  name: string;
  value: string;
}

export interface Attachment {
  attachmentId?: string;
  size?: number;
  data?: string;
}

export interface Part {
  filename?: string;
  mimeType?: string;
  partId: string;
  headers: Header[];
  body?: Attachment;
  parts?: Part[];
}

// From https://developers.google.com/gmail/api/v1/reference/users/messages#resource
export interface Message {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: number;
  internalDate?: number;
  payload?: Part;
  sizeEstimate?: number;
  raw?: any;
}

export interface Thread {
  id: string;
  historyId: number;
  messages: Message[];
  snippet: string;
}

export interface MessageMetadata {
  id: string;
  threadId: string;
}

export interface GetMessagesResponse {
  messages?: MessageMetadata[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GetProfileResponse {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: number;
}

export interface ThreadMetadata {
  id: string;
  historyId: number;
  snippet: string;
}

export interface GetThreadsResponse {
  threads?: ThreadMetadata[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface Draft {
  id: string;
  message: {
    raw: string;
  };
}

export interface Label {
  color: {
    backgroundColor: string;
    textColor: string;
  };
  id: string;
  labelListVisibility: string;
  messageListVisibility: string;
  name: string;
  messagesTotal: number;
  messagesUnread: number;
  threadsTotal: number;
  threadsUnread: number;
  type: 'system' | 'user';
}

export interface EmailAddress {
  name: string;
  email: string;
}
