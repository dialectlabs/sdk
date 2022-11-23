import { Connection, PublicKey } from '@solana/web3.js';
import { OnsolIdentityResolver } from './identity-onsol';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);

describe('onsol tests', () => {
  it('should perform direct lookup', async () => {
    const resolver = new OnsolIdentityResolver(connection);
    const owner = new PublicKey(
      '2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67',
    ).toBase58();
    const identity = await resolver.resolve(owner);

    expect(identity).toStrictEqual({
      type: 'Onsol',
      name: expect.stringContaining("miester.poor"),
      address: owner,
      additionals: {
        displayName: expect.stringContaining("miester.poor"),
      },
    });
  });

  it('should perform reverse lookup with any tld', async () => {
    const resolver = new OnsolIdentityResolver(connection);
    const domainTld = 'miester.poor';
    const identity = await resolver.resolveReverse(domainTld);
    expect(identity).toStrictEqual({
      type: 'Onsol',
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
