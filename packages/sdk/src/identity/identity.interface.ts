import type { PublicKey } from '@solana/web3.js';

export interface Identity {
  identityName: string;
  publicKey: PublicKey;
  name?: string;
  additonals?: {
    avatarUrl?: string;
    [key: string]: any;
  };
}

export interface ReverseIdentity {
  name: string;
  identityName: string;
  publicKey: PublicKey;
}

export interface IdentityResolver {
  resolve(
    publicKey: PublicKey,
    onProgress?: (identity: Identity) => void,
  ): Promise<Identity | null>;

  resolveReverse(
    domainName: string,
    onProgress?: (reverseIdentity: ReverseIdentity) => void,
  ): Promise<ReverseIdentity | null>;
}
