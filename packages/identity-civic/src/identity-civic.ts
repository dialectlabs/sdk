import { CivicProfile, ProfileResult } from '@civic/profile';
import type { Identity, IdentityResolver } from '@dialectlabs/sdk';
import { CivicIdentityError } from './identity-civic.error';
import type { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

const civicType = 'CIVIC';
const civicProfileToDialectIdentity = (
  profile: ProfileResult,
  defaultName = '',
): Identity => {
  return {
    name: profile?.name?.value || defaultName,
    publicKey: new PublicKey(profile.address),
    type: civicType,
    additionals: {
      avatarUrl: profile.image?.url,
      link: `https://www.civic.me/${profile.address}`,
      headline: profile.headline?.value,
    },
  };
};
export class CivicIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) {}
  get type(): string {
    return civicType;
  }

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    try {
      const profile = await CivicProfile.get(publicKey.toBase58(), {
        solana: { connection: this.connection },
      });
      if (!profile.name) {
        return null;
      }
      return civicProfileToDialectIdentity(profile);
    } catch (e: any) {
      if (!CivicIdentityError.ignoreMatcher.some((it) => e.message.match(it))) {
        throw new CivicIdentityError(e.message);
      }
    }
    return null;
  }

  async resolveReverse(_rawDomainName: string): Promise<Identity | null> {
    // CivicProfile supports other non-public key type queries like Bonfida addresses
    const profile = await CivicProfile.get(_rawDomainName);
    return civicProfileToDialectIdentity(profile);
  }
}
