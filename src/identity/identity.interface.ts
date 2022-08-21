import type { PublicKey } from '@solana/web3.js';

export interface Identity {
  publicKey: PublicKey;
  identityName: string;
  name?: string;
  avatarUrl?: string;
}

export interface IdentityResolver {
  resolve(
    publicKey: PublicKey,
    onProgress?: (identity: Identity | null) => void,
  ): Promise<Identity | null>;
}
