import type {
  AccountAddress,
  Identity,
  IdentityResolver,
} from '@dialectlabs/sdk';
import {
  findAddressByHandle,
  findHandleByAddress,
  IdentityResponse,
} from './api';

export class DialectIdentityResolver implements IdentityResolver {
  #addressToDialectIdentityCache: Record<AccountAddress, Identity | null> = {};
  #handleToDialectIdentityCache: Record<string, Identity | null> = {};

  constructor(private readonly baseUrl: string = 'https://dialectapi.to') {}

  get type(): string {
    return 'DIALECT_IDENTITY';
  }

  async resolve(address: AccountAddress): Promise<Identity | null> {
    let identity = this.#addressToDialectIdentityCache[address];
    if (identity === undefined) {
      const res = await findHandleByAddress(this.baseUrl, address);
      if (!res.length) {
        this.#addressToDialectIdentityCache[address] = null;
        return null;
      }
      identity = this.mapIdentity(res[0]!);
      this.#addressToDialectIdentityCache[address] = identity;
    }

    if (!identity) {
      return null;
    }

    this.#handleToDialectIdentityCache[identity.name] = identity;

    return identity;
  }

  async resolveReverse(handle: string): Promise<Identity | null> {
    let identity = this.#handleToDialectIdentityCache[handle];
    if (identity === undefined) {
      const res = await findAddressByHandle(this.baseUrl, handle);
      if (!res.length) {
        this.#handleToDialectIdentityCache[handle] = null;
        return null;
      }
      identity = this.mapIdentity(res[0]!);
      this.#handleToDialectIdentityCache[handle] = identity;
    }

    if (!identity) {
      return null;
    }

    this.#addressToDialectIdentityCache[identity.address] = identity;

    return identity;
  }

  private mapIdentity(identity: IdentityResponse): Identity | null {
    const dialectIdenity = identity.identities[0];
    if (!dialectIdenity) {
      return null;
    }
    return {
      type: this.type,
      address: identity.publicKey,
      name: dialectIdenity.name,
      additionals: {
        displayName: dialectIdenity.displayName,
        avatarUrl: dialectIdenity.avatarUrl,
      },
    };
  }
}
