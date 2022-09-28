import type { AccountAddress } from '../auth/auth.interface';

export interface Identity {
  type: string;
  address: AccountAddress;
  name: string;
  additionals?: {
    avatarUrl?: string;
    link?: string;
    displayName?: string;
    [key: string]: any;
  };
}

export abstract class IdentityResolver {
  abstract resolve(address: AccountAddress): Promise<Identity | null>;

  abstract resolveReverse(domainName: string): Promise<Identity | null>;

  abstract get type(): string;
}
