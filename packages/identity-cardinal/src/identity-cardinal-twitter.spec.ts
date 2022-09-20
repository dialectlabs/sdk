import { Connection, PublicKey } from '@solana/web3.js';
import { CardinalTwitterIdentityResolver } from './identity-cardinal-twitter';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);

describe('cardinal twitter tests', () => {
  it('should perform direct lookup', async () => {
    const resolver = new CardinalTwitterIdentityResolver(connection);
    const owner = new PublicKey(
      '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk',
    ).toBase58();
    const identity = await resolver.resolve(owner);

    expect(identity).toStrictEqual({
      type: 'CARDINAL_TWITTER',
      name: 'aliquotchris',
      additionals: {
        displayName: '@aliquotchris',
        link: `https://twitter.com/aliquotchris`,
        avatarUrl: undefined,
      },
      address: owner,
    });
  });

  it('should perform reverse lookup with @', async () => {
    const resolver = new CardinalTwitterIdentityResolver(connection);
    const domainName = '@aliquotchris';
    const identity = await resolver.resolveReverse(domainName);

    expect(identity).toEqual({
      type: 'CARDINAL_TWITTER',
      name: 'aliquotchris',
      address: '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk',
      additionals: {
        displayName: '@aliquotchris',
        link: `https://twitter.com/aliquotchris`,
        avatarUrl: undefined,
      },
    });
  });

  it('should perform reverse lookup without @', async () => {
    const resolver = new CardinalTwitterIdentityResolver(connection);
    const domainName = '@aliquotchris';
    const identity = await resolver.resolveReverse(domainName);

    expect(identity).toEqual({
      type: 'CARDINAL_TWITTER',
      name: 'aliquotchris',
      address: '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk',
      additionals: {
        displayName: '@aliquotchris',
        link: `https://twitter.com/aliquotchris`,
        avatarUrl: undefined,
      },
    });
  });
});
