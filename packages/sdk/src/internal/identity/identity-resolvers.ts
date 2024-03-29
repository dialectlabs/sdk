import { Identity, IdentityResolver } from '../../identity/identity.interface';
import type { AccountAddress } from '../../auth/auth.interface';

export class FirstFoundIdentityResolver extends IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {
    super();
  }

  get type(): string {
    return 'DIALECT_FIRST_FOUND_IDENTITY_RESOLVER';
  }

  async resolve(address: AccountAddress): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    for await (const resolver of this.resolvers) {
      try {
        const identity = await resolver.resolve(address);
        if (identity) {
          return identity;
        }
      } catch (e) {
        console.error(
          `error resolving identity at ${resolver.type} for account address ${address}`,
          e,
        );
      }
    }
    return null;
  }

  async resolveReverse(domainName: string): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    for await (const resolver of this.resolvers) {
      try {
        const reverseIdentity = await resolver.resolveReverse(domainName);
        if (reverseIdentity) {
          return reverseIdentity;
        }
      } catch (e) {
        console.error(
          `error resolving identity at ${resolver.type} for name ${domainName}`,
          e,
        );
      }
    }
    return null;
  }
}

export class FirstFoundFastIdentityResolver extends IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {
    super();
  }

  get type(): string {
    return 'DIALECT_FIRST_FOUND_FAST_IDENTITY_RESOLVER';
  }

  async resolve(address: AccountAddress): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const any = await Promise.any(
        this.resolvers.map((it) => it.resolve(address)),
      );
      return any;
    } catch (e) {
      console.error(
        `error resolving identity for account address ${address.toString()}`,
        e,
      );
    }

    return null;
  }

  async resolveReverse(domainName: string): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const any = await Promise.any(
        this.resolvers.map((it) => it.resolveReverse(domainName)),
      );
      return any;
    } catch (e) {
      console.error(`error resolving identity for name ${domainName}`, e);
    }

    return null;
  }
}

export class AggregateSequentialIdentityResolver extends IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {
    super();
  }

  get type(): string {
    return 'DIALECT_AGGREGATED_SEQUENTIAL_IDENTITY_RESOLVER';
  }

  async resolve(address: AccountAddress): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const allSettled = await Promise.allSettled(
        this.resolvers.map((it) => it.resolve(address)),
      );
      const resolved = allSettled.filter(
        (it) => it.status === 'fulfilled' && it.value !== null,
      );
      const aggregated = resolved
        .map((it) => it as PromiseFulfilledResult<Identity>)
        .map((it) => it.value)
        .reduce(
          (prev, curr) => {
            return {
              ...curr,
              ...prev,
              additionals: { ...curr.additionals, ...prev.additionals },
            };
          },
          {
            type: this.type,
            address: address,
          } as Identity,
        );

      if (!aggregated || !aggregated.name) {
        return null;
      }

      return aggregated;
    } catch (e) {
      console.error(
        `error resolving identity for account address ${address.toString()}`,
        e,
      );
    }

    return null;
  }

  async resolveReverse(domainName: string): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const allSettled = await Promise.allSettled(
        this.resolvers.map((it) => it.resolveReverse(domainName)),
      );
      const resolved = allSettled.filter((it) => it.status === 'fulfilled');
      const aggregated = resolved
        .map((it) => it as PromiseFulfilledResult<Identity>)
        .map((it) => it.value)
        .reduce(
          (prev, curr) => {
            return { ...curr, ...prev };
          },
          {
            type: 'DIALECT_AGGREGATED_IDENTITY',
            name: domainName,
          } as Identity,
        );

      if (!aggregated || !aggregated.address) {
        return null;
      }

      return aggregated;
    } catch (e) {
      console.error(`error resolving identity for name ${domainName}`, e);
    }

    return null;
  }
}
