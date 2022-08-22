import { Connection, PublicKey } from '@solana/web3.js';
import { SNSIdentityResolver } from './identity-sns';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);

describe('bonfida tests', () => {
  it('should perform direct lookup', async () => {
    const resolver = new SNSIdentityResolver(connection);
    const owner = new PublicKey('HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA');
    const identity = await resolver.resolve(owner);

    expect(identity).toStrictEqual({
      identityName: 'SNS',
      name: 'bonfida',
      publicKey: owner,
    });
  });

  it('should perform reverse lookup with .sol', async () => {
    const resolver = new SNSIdentityResolver(connection);
    const domainName = 'bonfida.sol';
    const identity = await resolver.resolveReverse(domainName);

    expect(identity).toStrictEqual({
      identityName: 'SNS',
      name: domainName,
      publicKey: new PublicKey('HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA'),
    });
  });

  it('should perform reverse lookup without .sol', async () => {
    const resolver = new SNSIdentityResolver(connection);
    const domainName = 'bonfida';
    const identity = await resolver.resolveReverse(domainName);

    expect(identity).toStrictEqual({
      identityName: 'SNS',
      name: domainName,
      publicKey: new PublicKey('HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA'),
    });
  });
});
