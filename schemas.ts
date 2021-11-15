import {PackId} from './manifest'
import {ValueHintType} from '@codahq/packs-sdk';
import {ValueType} from '@codahq/packs-sdk';
import {makeObjectSchema} from '@codahq/packs-sdk';
import {makeReferenceSchemaFromObjectSchema} from '@codahq/packs-sdk';
import {makeSchema} from '@codahq/packs-sdk';

const threadIdentity = {
  packId: PackId,
  name: 'Thread',
};

export const emailAddressSchema = makeObjectSchema({
  type: ValueType.Object,
  id: 'email',
  primary: 'name',
  properties: {
    name: {type: ValueType.String},
    email: {type: ValueType.String},
  },
});

export const emailAddressArraySchema = makeSchema({
  type: ValueType.Array,
  items: emailAddressSchema,
});

export const messageSchema = makeObjectSchema({
  type: ValueType.Object,
  identity: {
    packId: PackId,
    name: 'Email',
  },
  primary: 'subject',
  featured: ['from', 'to', 'date'],
  id: 'id',
  properties: {
    id: {type: ValueType.String, required: true},
    labels: {
      type: ValueType.Array,
      items: {type: ValueType.String},
    },
    to: emailAddressArraySchema,
    from: emailAddressSchema,
    subject: {type: ValueType.String, required: true},
    date: {type: ValueType.String, codaType: ValueHintType.Date},
    cc: emailAddressArraySchema,
    bcc: emailAddressArraySchema,
    text: {type: ValueType.String, codaType: ValueHintType.Html},
    thread: {
      type: ValueType.Object,
      codaType: ValueHintType.Reference,
      identity: threadIdentity,
      id: 'id',
      primary: 'subject',
      properties: {
        id: {type: ValueType.String, required: true},
        subject: {type: ValueType.String, required: true},
      },
    },
  },
});

export const threadListSchema = makeSchema({
  type: ValueType.Array,
  items: makeObjectSchema({
    type: ValueType.Object,
    primary: 'snippet',
    properties: {
      snippet: {type: ValueType.String, codaType: ValueHintType.Html},
      id: {type: ValueType.String},
      historyId: {type: ValueType.Number},
    },
  }),
});

export const threadSchema = makeObjectSchema({
  type: ValueType.Object,
  primary: 'subject',
  id: 'id',
  identity: threadIdentity,
  featured: ['startDate', 'recipients', 'messages'],
  properties: {
    id: {type: ValueType.String},
    startDate: {type: ValueType.String, codaType: ValueHintType.Date},
    endDate: {type: ValueType.String, codaType: ValueHintType.Date},
    subject: {type: ValueType.String},
    snippet: {type: ValueType.String},
    recipients: emailAddressArraySchema,
    messages: {type: ValueType.Array, items: makeReferenceSchemaFromObjectSchema(messageSchema)},
  },
});

export const messageListSchema = makeSchema({
  type: ValueType.Array,
  items: makeObjectSchema({
    type: ValueType.Object,
    primary: 'id',
    properties: {
      id: {type: ValueType.String},
      threadId: {type: ValueType.String},
    },
  }),
});
