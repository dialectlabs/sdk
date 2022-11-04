import type { AccountAddress } from '@dialectlabs/sdk';
import { SDK_VERSION } from './version';

const XClientNameHeader = 'x-client-name';
const XClientVersionHeader = 'x-client-version';

export function createHeaders() {
  return {
    [XClientNameHeader]: 'dialect-identity-resolver',
    [XClientVersionHeader]: SDK_VERSION,
  };
}

export interface Dapp {
  publicKey: string;
  name: string;
  description?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  heroUrl?: string;
  verified: boolean;
}

export async function fetchAllDapps(baseUrl: string): Promise<Dapp[]> {
  return fetch(`${baseUrl}/api/v1/dapps?verified=true`, {
    headers: createHeaders(),
  }).then((it) => it.json());
}

export interface DialectIdentity {
  id: string;
  type: string;
  externalId: string;
  name: string;
  avatarUrl?: string;
  link?: string;
  displayName?: string;
  additionalInfo?: Record<string, any>;
}

export interface IdentityResponse {
  publicKey: string;
  identities: DialectIdentity[];
}

export async function findAddressByHandle(
  baseUrl: string,
  handle: string,
): Promise<IdentityResponse[]> {
  return fetch(`${baseUrl}/api/v1/identities/search?name=${handle}`, {
    headers: createHeaders(),
  }).then((it) => it.json());
}

export async function findHandleByAddress(
  baseUrl: string,
  address: AccountAddress,
): Promise<IdentityResponse[]> {
  return fetch(`${baseUrl}/api/v1/identities/search?publicKey=${address}`, {
    headers: createHeaders(),
  }).then((it) => it.json());
}
