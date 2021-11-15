import {EmailAddress} from './types';
import {Label} from './types';
import {Message} from './types';
import {Part} from './types';
import {Thread} from './types';
import {UserVisibleError} from '@codahq/packs-sdk';
import * as emailparser from 'email-addresses';

interface MimeBodies {
  plain?: string;
  html?: string;
}

function escapeHtmlEntities(plain: string): string {
  return plain.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}

function getLabelName(labelId: string, labels: Label[]): string {
  const label = labels.find(l => l.id === labelId);
  return label ? label.name : labelId;
}

export function messageToSchema(message: Message, preferPlainText: boolean, labels?: Label[]) {
  const headers: any = {};
  ((message.payload && message.payload.headers) || []).forEach((header: any) => {
    headers[header.name] = header.value;
  });

  const bodies = getMessageBodies(message.payload);

  // Strip out giant style elements (Outlook)
  const htmlBody = bodies.html && bodies.html.replace(/<style.*<\/style>/gimsu, '');
  const textBody = bodies.plain && escapeHtmlEntities(bodies.plain);
  const text = (preferPlainText ? textBody || htmlBody : htmlBody || textBody) || '';

  return {
    snippet: message.snippet,
    id: message.id,
    labels: (message.labelIds || []).map(labelId => (labels ? getLabelName(labelId, labels) : labelId)),
    to: parseManyAddresses(headers.To),
    from: parseOneAddress(headers.From),
    subject: headers.Subject,
    date: headers.Date,
    cc: parseManyAddresses(headers.Cc),
    bcc: parseManyAddresses(headers.Bcc),
    thread: {
      id: message.threadId,
      subject: headers.Subject,
    },
    text: text.substr(0, 4 * 1024),
  };
}

export function parseOneAddress(email: string): EmailAddress | undefined {
  const parsed = emailparser.parseAddressList(email);
  if (!(Array.isArray(parsed) && parsed.length)) {
    return;
  }
  return getAddress(parsed[0]);
}

export function parseManyAddresses(header: string): EmailAddress[] {
  const array = emailparser.parseAddressList(header);
  if (!Array.isArray(array)) {
    return [];
  }
  return array.map(getAddress);
}

function getAddress(val: emailparser.ParsedMailbox | emailparser.ParsedGroup): EmailAddress {
  if (val.type === 'mailbox') {
    const casted = val as emailparser.ParsedMailbox;
    return {
      name: casted.name || casted.address,
      email: casted.address,
    };
  } else if (val.type === 'group') {
    const casted = val as emailparser.ParsedGroup;
    return {
      name: casted.name,
      email: casted.name,
    };
  } else {
    throw new UserVisibleError(`Unexpected parsed email address: ${val}`);
  }
}

function getMessageBodies(part?: Part): MimeBodies {
  let bodies: MimeBodies = {};
  if (!part) {
    return bodies;
  }

  if (part.mimeType && ['text/plain', 'text/html'].includes(part.mimeType) && part.body && part.body.data) {
    bodies[part.mimeType === 'text/plain' ? 'plain' : 'html'] = Buffer.from(part.body.data, 'base64').toString('utf8');
  }

  if (!part.parts) {
    return bodies;
  }

  for (const p of part.parts) {
    bodies = {...bodies, ...getMessageBodies(p)};
  }

  return bodies;
}

export function threadToSchema(thread: Thread, preferPlainText: boolean) {
  const messages = thread.messages.map(msg => messageToSchema(msg, preferPlainText));

  const dates = messages.map(msg => Date.parse(msg.date).valueOf());
  const firstDate = dates.length ? Math.min(...dates) : undefined;
  const lastDate = dates.length ? Math.max(...dates) : undefined;
  const subject = messages.length ? messages[0].subject : '';
  const recipients: Map<string, EmailAddress> = new Map();
  // tslint:disable-next-line
  const messageRefs: Array<{id: string; subject: string}> = [];
  messages.forEach(msg => {
    if (msg.from) {
      recipients.set(msg.from.email, msg.from);
    }
    [msg.to, msg.cc, msg.bcc].forEach(arr => arr.forEach(recp => recipients.set(recp.email, recp)));
    messageRefs.push({id: msg.id, subject: msg.subject});
  });

  return {
    id: thread.id,
    startDate: firstDate ? new Date(firstDate).toUTCString() : undefined,
    endDate: lastDate ? new Date(lastDate).toUTCString() : undefined,
    snippet: thread.snippet,
    subject,
    messages: messageRefs,
    recipients: [...recipients.values()],
  };
}

interface SearchArgs {
  containsText?: string;
  containsExactText?: string;
  from?: string[];
  to?: string[];
  subject?: string;
  label?: string;
  unread?: boolean;
  starred?: boolean;
  hasAttachment?: boolean;
  dateRange?: Date[];
  search?: string;
}

function dateToEpoch(d: Date): number {
  return Math.round(d.valueOf() / 1000);
}

export function getQuery({
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
}: SearchArgs): string {
  const parts: string[] = [];
  if (containsText) {
    parts.push(containsText);
  }
  if (containsExactText) {
    // Lazy way of quoting this thing.
    parts.push(JSON.stringify(containsExactText));
  }
  if (from) {
    parts.push(`(${from.map(f => `from:"${f}"`).join(' OR ')})`);
  }
  if (to) {
    parts.push(`(${to.map(f => `to:"${f}"`).join(' OR ')})`);
  }
  if (subject) {
    parts.push(`subject:"${subject}"`);
  }
  if (label) {
    // Strip out spaces and eliminate the quotes
    parts.push(`label:${label.replace(/ /g, '-')}`);
  }
  if (typeof unread !== 'undefined') {
    parts.push(unread ? 'is:unread' : 'is:read');
  }
  if (starred) {
    parts.push('is:starred');
  }
  if (hasAttachment) {
    parts.push('has:attachment');
  }
  if (dateRange && dateRange.length) {
    const [startDate, endDate] = dateRange;
    let startEpoch = dateToEpoch(startDate);
    if (startEpoch <= 0) {
      // Gmail filters reject 0 and negative values for epochs.
      startEpoch = 1;
    }
    parts.push(`after:${startEpoch}`);
    parts.push(`before:${dateToEpoch(endDate)}`);
  }
  if (search) {
    parts.push(search);
  }
  return parts.join(' ');
}
