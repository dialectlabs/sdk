import { Connection, PublicKey } from '@solana/web3.js';
import { ANSIdentityResolver } from './identity-ans';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);

describe('ans tests', () => {
  it('should perform direct lookup', async () => {
    const resolver = new ANSIdentityResolver(connection);
    const owner = new PublicKey(
      '2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67',
    ).toBase58();
    const identity = await resolver.resolve(owner);

    expect(identity).toStrictEqual({
      type: 'ANS',
      name: expect.stringContaining('miester.abc'),
      address: owner,
      additionals: {
        displayName: expect.stringContaining('miester.abc'),
      },
    });
  });

  it('should perform reverse lookup with any tld', async () => {
    const resolver = new ANSIdentityResolver(connection);
    const domainTld = 'miester.poor';
    const identity = await resolver.resolveReverse(domainTld);
    expect(identity).toStrictEqual({
      type: 'ANS',
      name: domainTld,
      address: new PublicKey(
        '2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67',
      ).toBase58(),
      additionals: {
        displayName: domainTld,
      },
    });
  });
});
