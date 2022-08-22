import type { PublicKey } from '@solana/web3.js';
import type {
  Identity,
  IdentityResolver,
  ReverseIdentity,
} from '@identity/identity.interface';

export class FirstFoundIdentityResolver implements IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {}

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
      } catch {
        // probably errors from identities could be ignored
        // but should be reported somehow?
      }
    }
    return null;
  }

  async resolveReverse(domainName: string): Promise<ReverseIdentity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    for await (const resolver of this.resolvers) {
      try {
        const reverseIdentity = await resolver.resolveReverse(domainName);
        if (reverseIdentity) {
          return reverseIdentity;
        }
      } catch {
        // probably errors from identities could be ignored
        // but should be reported somehow?
      }
    }
    return null;
  }
}

export class FirstFoundFastIdentityResolver implements IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {}

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const any = await Promise.any(
        this.resolvers.map((it) => it.resolve(publicKey)),
      );
      return any;
    } catch {
      // probably errors from identities could be ignored
      // but should be reported somehow?
    }

    return null;
  }

  async resolveReverse(domainName: string): Promise<ReverseIdentity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const any = await Promise.any(
        this.resolvers.map((it) => it.resolveReverse(domainName)),
      );
      return any;
    } catch {
      // probably errors from identities could be ignored
      // but should be reported somehow?
    }

    return null;
  }
}

export class AggregateSequentialIdentityResolver implements IdentityResolver {
  constructor(private readonly resolvers: IdentityResolver[]) {}

  async resolve(
    publicKey: PublicKey,
    onProgress?: (identity: Identity) => void,
  ): Promise<Identity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const allSettled = await Promise.allSettled(
        this.resolvers.map((it) =>
          it.resolve(publicKey).then((it) => {
            if (it) {
              onProgress?.(it);
            }
            return it;
          }),
        ),
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
            identityName: 'DIALECT_AGGREGATED_IDENTITY',
            publicKey: publicKey,
          } as Identity,
        );

      return aggregated;
    } catch {
      // probably errors from identities could be ignored
      // but should be reported somehow?
    }

    return null;
  }

  async resolveReverse(
    domainName: string,
    onProgress?: (reverseIdentity: ReverseIdentity) => void,
  ): Promise<ReverseIdentity | null> {
    if (!this.resolvers.length) {
      return null;
    }
    try {
      const allSettled = await Promise.allSettled(
        this.resolvers.map((it) =>
          it.resolveReverse(domainName).then((it) => {
            if (it) {
              onProgress?.(it);
            }
            return it;
          }),
        ),
      );
      const resolved = allSettled.filter((it) => it.status === 'fulfilled');
      const aggregated = resolved
        .map((it) => it as PromiseFulfilledResult<ReverseIdentity>)
        .map((it) => it.value)
        .reduce(
          (prev, curr) => {
            return { ...curr, ...prev };
          },
          {
            identityName: 'DIALECT_AGGREGATED_IDENTITY',
            name: domainName,
          } as ReverseIdentity,
        );

      if (!aggregated || !aggregated.publicKey) {
        return null;
      }

      return aggregated;
    } catch {
      // probably errors from identities could be ignored
      // but should be reported somehow?
    }

    return null;
  }
}
