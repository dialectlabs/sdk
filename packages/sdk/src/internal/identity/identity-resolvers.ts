import type { PublicKey } from '@solana/web3.js';
import type { Identity, IdentityResolver } from '@identity/identity.interface';

export class FirstFoundIdentityResolver implements IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {}

  get type(): string {
    return 'DIALECT_FIRST_FOUND_IDENTITY_RESOLVER';
  }

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    for await (const resolver of this.resolvers) {
      try {
        const identity = await resolver.resolve(publicKey);
        if (identity) {
          return identity;
        }
      } catch (e) {
        console.error(
          `error resolving identity at ${
            resolver.type
          } for public key ${publicKey.toString()}`,
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

export class FirstFoundFastIdentityResolver implements IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {}

  get type(): string {
    return 'DIALECT_FIRST_FOUND_FAST_IDENTITY_RESOLVER';
  }

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const any = await Promise.any(
        this.resolvers.map((it) => it.resolve(publicKey)),
      );
      return any;
    } catch (e) {
      console.error(
        `error resolving identity for public key ${publicKey.toString()}`,
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

export class AggregateSequentialIdentityResolver implements IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {}

  get type(): string {
    return 'DIALECT_AGGREGATED_SEQUENTIAL_IDENTITY_RESOLVER';
  }

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const allSettled = await Promise.allSettled(
        this.resolvers.map((it) => it.resolve(publicKey)),
      );
      const resolved = allSettled.filter((it) => it.status === 'fulfilled');
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
            publicKey: publicKey,
          } as Identity,
        );

      if (!aggregated || !aggregated.name) {
        return null;
      }

      return aggregated;
    } catch (e) {
      console.error(
        `error resolving identity for public key ${publicKey.toString()}`,
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

      if (!aggregated || !aggregated.publicKey) {
        return null;
      }

      return aggregated;
    } catch (e) {
      console.error(`error resolving identity for name ${domainName}`, e);
    }

    return null;
  }
}
