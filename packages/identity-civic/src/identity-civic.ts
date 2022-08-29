import { CivicProfile } from '@civic/profile';
import type { Identity, IdentityResolver } from '@dialectlabs/sdk';
import type { Connection, PublicKey } from '@solana/web3.js';

export class CivicIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) {}
  get type(): string {
    return 'CIVIC';
  }

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    const profile = await CivicProfile.get(publicKey.toBase58(), {
      solana: { connection: this.connection },
    });
    return {
      name: profile?.name?.value || '',
      publicKey,
      type: this.type,
      additionals: {
        avatarUrl: profile.image?.url,
        link: `https://www.civic.me/${publicKey.toBase58()}`,
        headline: profile.headline,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolveReverse(_rawDomainName: string): Promise<Identity | null> {
    throw new Error('resolveReverse not implemented');
  }
}
