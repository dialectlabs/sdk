import { SDK_VERSION } from './version';

const XClientNameHeader = 'x-client-name';
const XClientVersionHeader = 'x-client-version';

export function createHeaders() {
  return {
    [XClientNameHeader]: 'dialect-sdk',
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
