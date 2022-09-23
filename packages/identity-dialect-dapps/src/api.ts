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
  return fetch(`${baseUrl}/api/v1/dapps?verified=true`).then((it) => it.json());
}
