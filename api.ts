import {Draft} from './types';
import {ExecutionContext} from '@codahq/packs-sdk';
import {FetchRequest} from '@codahq/packs-sdk';
import {GetMessagesResponse} from './types';
import {GetProfileResponse} from './types';
import {GetThreadsResponse} from './types';
import {InvocationLocation} from '@codahq/packs-sdk/dist/api_types';
import {Label} from './types';
import {Message} from './types';
import {MessageMetadata} from './types';
import MimeBuilder from 'emailjs-mime-builder';
import {Thread} from './types';
import {ThreadMetadata} from './types';
import base64url from 'base64url';
import {withQueryParams} from '@codahq/packs-sdk';

const defaultMaxResults = 250;

const METADATA_TIMEOUT_SECS = 30 * 60;

const querySubstitutions: {[key: string]: string} = {
  'has:yellow-star': 'l:^ss_sy',
  'has:blue-star': 'l:^ss_sb ',
  'has:red-star': 'l:^ss_sr ',
  'has:orange-star': 'l:^ss_so',
  'has:green-star': 'l:^ss_sg',
  'has:purple-star': 'l:^ss_sp',
  'has:red-bang': 'l:^ss_cr',
  'has:yellow-bang': 'l:^ss_cy',
  'has:blue-info': 'l:^ss_cb',
  'has:orange-guillemet': 'l:^ss_co',
  'has:green-check': 'l:^ss_cg',
  'has:purple-question': 'l:^ss_cp',
};

/**
 * Annoyingly, some queries from the gmail inbox don't work properly via the API and require translation.
 */
function rewriteGmailQueryForApi(query: string): string {
  return query
    .split(' ')
    .map(part => {
      if (!Object.keys(querySubstitutions).includes(part)) {
        return part;
      }
      return querySubstitutions[part];
    })
    .join(' ');
}

interface SendMessageParams {
  to: string;
  subject: string;
  threadId?: string;
  [key: string]: string | boolean | undefined;
}

/**
 * Encodes a basic text message into a base64 encoded MIME envelope.
 */
function encodeMessage(
  params: SendMessageParams,
  content: string,
  signatureOptions?: {showSignature: boolean; invocationLocation?: InvocationLocation},
): string {
  // Do a rudimentary test to try and check if the content is html or plain text. There is no good html test other than
  // trying to use something like jsdom so just going with a much cheaper but hacky test. It should suffice for now and
  // if needed we can make the regex much more specific in future.
  const htmlDetectorRegex = new RegExp(/<\/?[a-z][\s\S]*>/);
  const isHtmlContent = htmlDetectorRegex.test(content);
  if (!isHtmlContent) {
    // Content is plain text. We might eventually try to add branded message etc to it, however, if we do that we would
    // want to preserve line breaks etc. Convert the plain text to a simple html fragment to allow for that.
    content = content
      .split('\n')
      .map(line => `<div><span>${line}</span></div>`)
      .join('<div><br></div>');
  }

  if (signatureOptions?.showSignature && signatureOptions?.invocationLocation) {
    content = _brandMessage(content, signatureOptions.invocationLocation);
  }

  // TODO: To fully support HTML type we need to ensure we are using multi-part body etc. The existing implementation
  // hasn't been tested to verify it works well in all cases and is extremely likely to break in a number of cases.
  const builder = new MimeBuilder('text/html', {
    includeBccInHeader: true,
  });

  Object.keys(params).forEach(key => {
    // Convert someKeyName to Some-Key-Name
    const mimeKey = key
      .split(/(?=[A-Z])/)
      .map(keyPart => keyPart.charAt(0).toUpperCase() + keyPart.substr(1))
      .join('-');

    builder.setHeader(mimeKey, params[key] as any);
  });

  builder.setContent(content);

  return base64url(builder.build());
}

/**
 * Adds a tracked Coda link to every message sent with the Gmail pack.
 */
function _brandMessage(content: string, invocationLocation?: {protocolAndHost: string; docId?: string}): string {
  const docUrl =
    invocationLocation && invocationLocation.docId
      ? `${invocationLocation.protocolAndHost}/d/_d${invocationLocation.docId}`
      : 'https://coda.link/gmail';
  return (
    content +
    '<div style="color: #AEAEAE;font-size:75%"><br/>' +
    `Sent via <a href="${docUrl}" target="_blank" style="color: #AEAEAE">this Coda doc</a></div>`
  );
}

export async function sendMail(
  params: SendMessageParams,
  content: string,
  context: ExecutionContext,
): Promise<Message> {
  const {hideSignature, threadId} = params;
  const encodedMsg = encodeMessage(params, content, {
    showSignature: !hideSignature,
    invocationLocation: context.invocationLocation,
  });
  const request: FetchRequest = {
    method: 'POST',
    url: 'https://www.googleapis.com/gmail/v1/users/me/messages/send',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMsg,
      threadId,
    }),
  };
  const response = await context.fetcher!.fetch(request);
  return response.body;
}

export async function createDraftTextMail(
  params: SendMessageParams,
  content: string,
  context: ExecutionContext,
): Promise<Draft> {
  const encodedMsg = encodeMessage(params, content);
  const requestBody = {message: {raw: encodedMsg}};
  const request: FetchRequest = {
    method: 'POST',
    url: 'https://www.googleapis.com/gmail/v1/users/me/drafts',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  };
  const response = await context.fetcher!.fetch(request);
  return response.body;
}

export interface CountOptions {
  q?: string;
  includeSpamTrash?: boolean;
}

export interface GetObjectsOptions {
  incudeSpamTrash?: boolean;
  maxResults?: number;
  pageToken?: string;
  q?: string;
}

export async function getProfile(context: ExecutionContext): Promise<GetProfileResponse> {
  const request: FetchRequest = {
    method: 'GET',
    url: `https://www.googleapis.com/gmail/v1/users/me/profile`,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return (await context.fetcher!.fetch(request)).body;
}

export async function getMessage(id: string, context: ExecutionContext): Promise<Message> {
  const request: FetchRequest = {
    method: 'GET',
    url: `https://www.googleapis.com/gmail/v1/users/me/messages/${id}`,
    headers: {
      'Content-Type': 'application/json',
    },
    cacheTtlSecs: METADATA_TIMEOUT_SECS,
  };
  const response = await context.fetcher!.fetch(request);
  return response.body;
}

export async function getMessagesPage(
  options: GetObjectsOptions,
  context: ExecutionContext,
): Promise<GetMessagesResponse> {
  if (options.q) {
    options.q = rewriteGmailQueryForApi(options.q);
  }

  const url = withQueryParams('https://www.googleapis.com/gmail/v1/users/me/messages', {
    ...options,
  });

  const request: FetchRequest = {
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const response = await context.fetcher!.fetch(request);
  return response.body;
}

export async function getMessages(options: GetObjectsOptions, context: ExecutionContext): Promise<MessageMetadata[]> {
  const totalMessages: MessageMetadata[] = [];
  let maxResults = options.maxResults || defaultMaxResults;

  while (maxResults > 0) {
    const {messages, nextPageToken} = await getMessagesPage(options, context);
    if (!messages) {
      break;
    }

    if (messages.length > maxResults) {
      messages.splice(maxResults);
    }

    totalMessages.push(...messages);
    maxResults -= messages.length;
    options.pageToken = nextPageToken;
    if (!nextPageToken) {
      break;
    }
  }

  return totalMessages;
}

export async function getThread(id: string, context: ExecutionContext): Promise<Thread> {
  const request: FetchRequest = {
    method: 'GET',
    url: `https://www.googleapis.com/gmail/v1/users/me/threads/${id}?format=full`,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const response = await context.fetcher!.fetch(request);
  return response.body;
}

export async function getThreadsPage(
  options: GetObjectsOptions,
  context: ExecutionContext,
): Promise<GetThreadsResponse> {
  if (options.q) {
    options.q = rewriteGmailQueryForApi(options.q);
  }

  const url = withQueryParams('https://www.googleapis.com/gmail/v1/users/me/threads', {
    ...options,
  });

  const request: FetchRequest = {
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const response = await context.fetcher!.fetch(request);
  return response.body;
}

export async function getThreads(options: GetObjectsOptions, context: ExecutionContext): Promise<ThreadMetadata[]> {
  const totalThreads: ThreadMetadata[] = [];
  let maxResults = options.maxResults || defaultMaxResults;

  while (maxResults > 0) {
    const {threads, nextPageToken} = await getThreadsPage(options, context);
    if (!threads) {
      break;
    }
    if (threads.length > maxResults) {
      threads.splice(maxResults);
    }

    totalThreads.push(...threads);
    maxResults -= threads.length;
    options.pageToken = nextPageToken;
    if (!nextPageToken) {
      break;
    }
  }

  return totalThreads;
}

export async function getLabels(context: ExecutionContext): Promise<Label[]> {
  const request: FetchRequest = {
    method: 'GET',
    url: 'https://www.googleapis.com/gmail/v1/users/me/labels',
    headers: {
      'Content-Type': 'application/json',
    },
    cacheTtlSecs: METADATA_TIMEOUT_SECS,
  };
  const response = await context.fetcher!.fetch(request);
  return (response.body && response.body.labels) || [];
}
