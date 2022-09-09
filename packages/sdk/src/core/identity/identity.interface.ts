import type { PublicKey } from '../auth/auth.interface';

export interface Identity {
  type: string;
  publicKey: PublicKey;
  name: string;
  additionals?: {
    avatarUrl?: string;
    link?: string;
    displayName?: string;
    [key: string]: any;
  };
}

export interface IdentityResolver {
  resolve(publicKey: PublicKey): Promise<Identity | null>;

  resolveReverse(domainName: string): Promise<Identity | null>;

  get type(): string;
}
