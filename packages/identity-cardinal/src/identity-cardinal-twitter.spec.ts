import { Connection, PublicKey } from '@solana/web3.js';
import { CardinalTwitterIdentityResolver } from './identity-cardinal-twitter';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);

describe('cardinal twitter tests', () => {
  it('should perform direct lookup', async () => {
    const resolver = new CardinalTwitterIdentityResolver(connection);
    const owner = new PublicKey('3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk');
    const identity = await resolver.resolve(owner);

    expect(identity).toStrictEqual({
      identityName: 'CARDINAL_TWITTER',
      name: 'aliquotchris',
      additionals: {
        link: `https://twitter.com/aliquotchris`,
        avatarUrl: undefined,
      },
      publicKey: owner,
    });
  });

  it('should perform reverse lookup with @', async () => {
    const resolver = new CardinalTwitterIdentityResolver(connection);
    const domainName = '@aliquotchris';
    const identity = await resolver.resolveReverse(domainName);

    expect(identity).toEqual({
      identityName: 'CARDINAL_TWITTER',
      name: 'aliquotchris',
      publicKey: new PublicKey('3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk'),
    });
  });

  it('should perform reverse lookup without @', async () => {
    const resolver = new CardinalTwitterIdentityResolver(connection);
    const domainName = 'aliquotchris';
    const identity = await resolver.resolveReverse(domainName);

    expect(identity).toEqual({
      identityName: 'CARDINAL_TWITTER',
      name: domainName,
      publicKey: new PublicKey('3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk'),
    });
  });
});
