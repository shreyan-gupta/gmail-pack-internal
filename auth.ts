import {FetchRequest} from '@codahq/packs-sdk';
import {MetadataFormula} from '@codahq/packs-sdk';
import {makeMetadataFormula} from '@codahq/packs-sdk';

export const profileScopes = ['profile', 'email'];

export const getConnectionName: MetadataFormula = makeMetadataFormula(async context => {
  const request: FetchRequest = {
    method: 'GET',
    url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const response = await context.fetcher!.fetch(request);
  return response.body.email;
});
