import {AuthenticationType} from '@codahq/packs-sdk';
import {FeatureSet} from '@codahq/packs-sdk/dist/legacy_exports';
import {PackCategory} from '@codahq/packs-sdk/dist/legacy_exports';
import {PackDefinition} from '@codahq/packs-sdk';
import {QuotaLimitType} from '@codahq/packs-sdk/dist/legacy_exports';
import {formulas} from './formulas';
import {getConnectionName} from './auth';
import {profileScopes} from './auth';
import {syncTables} from './formulas';

export const PackId = 100007;

export const manifest: PackDefinition = {
  id: PackId,
  name: 'Gmail-Internal',
  shortDescription: 'See your emails, and send new emails from your doc.',
  description:
    'Pull in emails from your inbox, filter and search messages, and send new emails directly ' + 'from your doc.',
  permissionsDescription: 'Read and send email.',
  version: '2.0.1',
  category: PackCategory.Communication,
  logoPath: 'gmail.png',
  defaultAuthentication: {
    // TODO(oleg): store secrets somewhere better, like in AWS Secrets Manager.
    type: AuthenticationType.OAuth2,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://accounts.google.com/o/oauth2/token',
    scopes: [
      // Read all resources and their metadata—no write operations.
      'https://www.googleapis.com/auth/gmail.readonly',
      // Send messages only. No read or modify privileges on mailbox
      'https://www.googleapis.com/auth/gmail.send',
      // Compose draft messages.
      'https://www.googleapis.com/auth/gmail.compose',
      ...profileScopes,
    ],
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent select_account',
      session: false,
    },
    getConnectionName,
  },
  exampleImages: ['gmail_example1.png', 'gmail_example2.png'],
  formulaNamespace: 'Gmail',
  formulas,
  networkDomains: ['www.googleapis.com'],
  formats: [],
  syncTables,
  // If you update these, remember to run tools/generate_quotas_runtime_config.ts.
  quotas: {
    [FeatureSet.Basic]: {
      monthlyLimits: {
        [QuotaLimitType.Action]: 20,
      },
    },
  },
};
