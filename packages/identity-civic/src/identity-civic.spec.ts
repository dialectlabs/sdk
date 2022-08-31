import { Connection, PublicKey } from '@solana/web3.js';
import { CivicIdentityResolver } from './identity-civic';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);

describe('Civic tests', () => {
  it('should perform direct lookup', async () => {
    const resolver = new CivicIdentityResolver(connection);
    const owner = new PublicKey('4Gh3VaUQ5iR7YuqJFBzHZJ95owganwfBidDCNf9RE7cE');
    const identity = await resolver.resolve(owner);

    expect(identity).toStrictEqual({
      type: 'CIVIC',
      name: 'my.nfts',
      publicKey: owner,
      additionals: {
        avatarUrl: 'https://arweave.net/C3oH-InR6fqeqN62TQOI5LnQqNXDmboRK75xFIIT3fU',
        link: `https://www.civic.me/${owner.toBase58()}`,
        headline: 'this is my headline'
      },
    });
  });

});
