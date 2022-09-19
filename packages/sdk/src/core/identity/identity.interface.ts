import type { AccountAddress } from '../auth/auth.interface';

export interface Identity {
  type: string;
  accountAddress: AccountAddress;
  name: string;
  additionals?: {
    avatarUrl?: string;
    link?: string;
    displayName?: string;
    [key: string]: any;
  };
}

export interface IdentityResolver {
  resolve(accountAddress: AccountAddress): Promise<Identity | null>;

  resolveReverse(domainName: string): Promise<Identity | null>;

  get type(): string;
}
