export async function fetchAllDapps(baseUrl: string): Promise<
  {
    publicKey: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    verified: boolean;
  }[]
> {
  return fetch(`${baseUrl}/api/v1/dapps?verified=true`).then((it) => it.json());
}
