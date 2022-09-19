import { Connection, PublicKey } from '@solana/web3.js';
import { SNSIdentityResolver } from './identity-sns';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);

describe('bonfida tests', () => {
  it('should perform direct lookup', async () => {
    const resolver = new SNSIdentityResolver(connection);
    const owner = new PublicKey(
      'HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA',
    ).toBase58();
    const identity = await resolver.resolve(owner);

    expect(identity).toStrictEqual({
      type: 'SNS',
      name: 'bonfida',
      accountAddress: owner,
      additionals: {
        displayName: 'bonfida.sol',
      },
    });
  });

  it('should perform reverse lookup with .sol', async () => {
    const resolver = new SNSIdentityResolver(connection);
    const domainName = 'bonfida.sol';
    const identity = await resolver.resolveReverse(domainName);

    expect(identity).toStrictEqual({
      type: 'SNS',
      name: domainName,
      accountAddress: new PublicKey(
        'HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA',
      ).toBase58(),
      additionals: {
        displayName: 'bonfida.sol',
      },
    });
  });

  it('should perform reverse lookup without .sol', async () => {
    const resolver = new SNSIdentityResolver(connection);
    const domainName = 'bonfida.sol';
    const identity = await resolver.resolveReverse(domainName);

    expect(identity).toStrictEqual({
      type: 'SNS',
      name: domainName,
      accountAddress: new PublicKey(
        'HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA',
      ).toBase58(),
      additionals: {
        displayName: 'bonfida.sol',
      },
    });
  });
});
