import {ConnectionRequirement} from '@codahq/packs-sdk';
import {MessageMetadata} from './types';
import {PrecannedDateRange} from '@codahq/packs-sdk';
import {ThreadMetadata} from './types';
import {autocompleteSearchObjects} from '@codahq/packs-sdk';
import {createDraftTextMail} from './api';
import {getLabels} from './api';
import {getMessage} from './api';
import {getMessages} from './api';
import {getMessagesPage} from './api';
import {getProfile} from './api';
import {getQuery} from './helpers';
import {getThread} from './api';
import {getThreads} from './api';
import {getThreadsPage} from './api';
import {makeBooleanParameter} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeDateArrayParameter} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeHtmlParameter} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeMetadataFormula} from '@codahq/packs-sdk';
import {makeNumericFormula} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeNumericParameter} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeObjectFormula} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeStringArrayParameter} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeStringFormula} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeStringParameter} from '@codahq/packs-sdk/dist/legacy_exports';
import {makeSyncTableLegacy} from '@codahq/packs-sdk/dist/legacy_exports';
import {messageToSchema} from './helpers';
import * as schemas from './schemas';
import {sendMail} from './api';
import {threadToSchema} from './helpers';

// TODO add default
const maxResultsParameter = makeNumericParameter('maxResults', 'The maximum number of threads to return.', {
  optional: true,
});

const searchParameter = makeStringParameter(
  'search',
  'The search terms. ' +
    'You can leave this blank to return everything, or use any valid Gmail search, like "is: important". ' +
    'For a list of available options, see https://support.google.com/mail/answer/7190?hl=en',
  {optional: true},
);

const containsTextParameter = makeStringParameter('containsText', 'Returns emails that contain the given words.', {
  optional: true,
});

const containsExactTextParameter = makeStringParameter(
  'containsExactText',
  'Returns emails that contain the given words exactly.',
  {optional: true},
);

const fromParameter = makeStringArrayParameter('from', 'Returns emails sent from the given people.', {optional: true});

const toParameter = makeStringArrayParameter('to', 'Returns emails sent to the given people.', {optional: true});

const subjectParameter = makeStringParameter('subject', 'Returns emails where the subject contains the given words.', {
  optional: true,
});

const labelParameter = makeStringParameter('label', 'Returns emails with the given label.', {
  optional: true,
  autocomplete: makeMetadataFormula(async (context, search) => {
    return autocompleteSearchObjects(search, await getLabels(context), 'name', 'name');
  }),
});

const unreadParameter = makeBooleanParameter(
  'unread',
  'Returns emails that are either read or unread, depending upon the input.',
  {optional: true},
);

const starredParameter = makeBooleanParameter('starred', 'Returns emails that are starred.', {optional: true});

const hasAttachmentParameter = makeBooleanParameter('hasAttachment', 'Returns emails that have attachments.', {
  optional: true,
});

const dateRangeParameter = makeDateArrayParameter('dateRange', 'Returns emails from within the given date range.', {
  optional: true,
  defaultValue: PrecannedDateRange.Last7Days,
});

const advancedSearchParameter = makeStringParameter(
  'advancedSearch',
  'An Gmail search query, suitable for advanced Gmail users. ' +
    'For a list of available options, see https://support.google.com/mail/answer/7190?hl=en',
  {optional: true},
);

const preferPlainTextParameter = makeBooleanParameter(
  'preferPlainText',
  'If specified, plain text emails are returned by default instead of HTML emails',
  {optional: true},
);

function messagesListToSchema(metadataList: MessageMetadata[]): any {
  return metadataList.map(metadata => {
    return {
      id: metadata.id,
      threadId: metadata.threadId,
    };
  });
}

function threadsListToSchema(metadataList: ThreadMetadata[]): any {
  return metadataList.map(metadata => {
    return {
      snippet: metadata.snippet,
      id: metadata.id,
      historyId: metadata.historyId,
    };
  });
}

export const formulas = [
  makeStringFormula({
    name: 'SendEmail',
    description: 'Sends an email from your Gmail account.',
    execute: async (args, context) => {
      const [to, subject, content, cc, bcc, from, replyTo, hideSignature, threadId] = args;
      const response = await sendMail({to, subject, cc, bcc, from, replyTo, hideSignature, threadId}, content, context);
      return response.id;
    },
    parameters: [
      makeStringParameter('to', 'The email address. For example, "alice@example.com".'),
      makeStringParameter('subject', 'The subject line of the email.'),
      makeHtmlParameter('content', 'The text of the email.'),
      makeStringParameter('cc', 'An email address to CC.', {optional: true}),
      makeStringParameter('bcc', 'An email address to BCC.', {optional: true}),
      makeStringParameter('from', 'The email address to send the email from.', {optional: true}),
      makeStringParameter(
        'replyTo',
        "The email's reply-to address. This is where replies to the email should be sent.",
        {optional: true},
      ),
      makeBooleanParameter('hideSignature', 'Should the email include the document link.', {optional: true}),
      makeStringParameter('threadId', 'The thread to send the email reply to.', {optional: true}),
    ],
    isAction: true,
    connectionRequirement: ConnectionRequirement.Required,
    examples: [],
  }),
  makeStringFormula({
    name: 'CreateDraft',
    description: "Creates a draft email in your Gmail account's draft folder.",
    execute: async (args, context) => {
      const [to, subject, content, cc, bcc] = args;
      const response = await createDraftTextMail({to, subject, cc, bcc}, content, context);
      return response.id;
    },
    parameters: [
      makeStringParameter('to', 'The email address. For example, "alice@example.com".'),
      makeStringParameter('subject', 'The subject line of the email.'),
      makeHtmlParameter('content', 'The text of the email.'),
      makeStringParameter('cc', 'An email address to CC.', {optional: true}),
      makeStringParameter('bcc', 'An email address to BCC.', {optional: true}),
    ],
    isAction: true,
    connectionRequirement: ConnectionRequirement.Required,
    examples: [],
  }),
  makeNumericFormula({
    name: 'ThreadCount',
    description: 'Returns the count of threads in your Gmail account that match the specified Gmail search term.',
    execute: async ([q], context) => {
      if (q) {
        const page = await getThreadsPage({q}, context);
        return page.resultSizeEstimate || 0;
      } else {
        const profile = await getProfile(context);
        return profile.threadsTotal;
      }
    },
    parameters: [searchParameter],
    connectionRequirement: ConnectionRequirement.Required,
    examples: [
      {
        params: ['label:inbox'],
        result: 41,
      },
      {
        params: ['label:inbox has:red-bang'],
        result: 3,
      },
      {
        params: ['label:draft is:unread'],
        result: 5,
      },
    ],
  }),
  makeObjectFormula({
    name: 'Threads',
    description: 'Returns email threads that match the provided search term.',
    execute: async ([query, maxResults], context) => {
      const threads = await getThreads({q: query, maxResults}, context);
      return threadsListToSchema(threads);
    },
    parameters: [searchParameter, maxResultsParameter],
    connectionRequirement: ConnectionRequirement.Required,
    examples: [],
    response: {
      schema: schemas.threadListSchema,
    },
  }),
  makeNumericFormula({
    name: 'MessageCount',
    description: 'Returns the count of messages in your Gmail account that match the specified Gmail search term.',
    execute: async ([q], context) => {
      if (q) {
        const page = await getMessagesPage({q}, context);
        return page.resultSizeEstimate || 0;
      } else {
        const profile = await getProfile(context);
        return profile.messagesTotal;
      }
    },
    parameters: [searchParameter],
    connectionRequirement: ConnectionRequirement.Required,
    examples: [
      {
        params: ['label:inbox'],
        result: 143,
      },
      {
        params: ['label:inbox has:red-bang'],
        result: 3,
      },
      {
        params: ['label:draft is:unread'],
        result: 5,
      },
    ],
  }),
  makeObjectFormula({
    name: 'Messages',
    description: 'Returns messages that match the provided search term.',
    execute: async ([query, maxResults], context) => {
      const messageMetadataList = await getMessages({q: query, maxResults}, context);
      return messagesListToSchema(messageMetadataList);
    },
    parameters: [searchParameter, maxResultsParameter],
    connectionRequirement: ConnectionRequirement.Required,
    examples: [],
    response: {
      schema: schemas.messageListSchema,
    },
  }),
];

export const syncTables = [
  makeSyncTableLegacy('Messages', schemas.messageSchema, {
    name: 'Messages',
    description: 'Returns messages.',
    execute: async (params, context) => {
      const [
        containsText,
        containsExactText,
        from,
        to,
        subject,
        label,
        unread,
        starred,
        hasAttachment,
        dateRange,
        search,
        preferPlainText,
      ] = params;
      const q = getQuery({
        containsText,
        containsExactText,
        from,
        to,
        subject,
        label,
        unread,
        starred,
        hasAttachment,
        dateRange,
        search,
      });
      const {messages, nextPageToken} = await getMessagesPage(
        {q, pageToken: context.sync.continuation?.nextPageToken as string | undefined, maxResults: 40},
        context,
      );
      const messageContents = await Promise.all((messages || []).map(({id}) => getMessage(id, context)));
      const labels = await getLabels(context);
      return {
        result: messageContents.map(msg => messageToSchema(msg, preferPlainText, labels)),
        continuation: nextPageToken ? {nextPageToken} : undefined,
      };
    },
    parameters: [
      containsTextParameter,
      containsExactTextParameter,
      fromParameter,
      toParameter,
      subjectParameter,
      labelParameter,
      unreadParameter,
      starredParameter,
      hasAttachmentParameter,
      dateRangeParameter,
      advancedSearchParameter,
      preferPlainTextParameter,
    ],
    connectionRequirement: ConnectionRequirement.Required,
    examples: [],
  }),
  makeSyncTableLegacy('Threads', schemas.threadSchema, {
    name: 'Threads',
    description: 'Returns threads.',
    execute: async (params, context) => {
      const [
        containsText,
        containsExactText,
        from,
        to,
        subject,
        label,
        unread,
        starred,
        hasAttachment,
        dateRange,
        search,
        preferPlainText,
      ] = params;
      const q = getQuery({
        containsText,
        containsExactText,
        from,
        to,
        subject,
        label,
        unread,
        starred,
        hasAttachment,
        dateRange,
        search,
      });
      const {threads, nextPageToken} = await getThreadsPage(
        {q, pageToken: context.sync.continuation?.nextPageToken as string | undefined, maxResults: 40},
        context,
      );
      const threadContents = await Promise.all((threads || []).map(({id}) => getThread(id, context)));
      return {
        // TODO: fix types.
        result: threadContents.map(thread => threadToSchema(thread, preferPlainText)) as any,
        continuation: nextPageToken ? {nextPageToken} : undefined,
      };
    },
    parameters: [
      containsTextParameter,
      containsExactTextParameter,
      fromParameter,
      toParameter,
      subjectParameter,
      labelParameter,
      unreadParameter,
      starredParameter,
      hasAttachmentParameter,
      dateRangeParameter,
      advancedSearchParameter,
      preferPlainTextParameter,
    ],
    connectionRequirement: ConnectionRequirement.Required,
    examples: [],
  }),
];
