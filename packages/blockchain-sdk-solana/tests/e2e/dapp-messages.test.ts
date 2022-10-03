import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AddressType, Dialect, ThreadMemberScope } from '@dialectlabs/sdk';
import { NodeDialectSolanaWalletAdapter, SolanaSdkFactory } from '../../src';

function sdkFactory(backend: 'solana' | 'dialect-cloud') {
  return async () => {
    const wallet = NodeDialectSolanaWalletAdapter.create();

    const solanaSdkFactory = SolanaSdkFactory.create({
      wallet: NodeDialectSolanaWalletAdapter.create(),
    });
    const dialectSdk = Dialect.sdk(
      {
        environment: 'local-development',
      },
      solanaSdkFactory,
    );
    if (backend === 'solana') {
      const program = dialectSdk.blockchainSdk.dialectProgram;
      const airdropRequest = await program.provider.connection.requestAirdrop(
        wallet.publicKey,
        LAMPORTS_PER_SOL * 100,
      );
      await program.provider.connection.confirmTransaction(airdropRequest);
    }
    return dialectSdk;
  };
}

describe('Dapp messages (e2e)', () => {
  it.each([
    ['solana', sdkFactory('solana')],
    ['dialect-cloud', sdkFactory('dialect-cloud')],
  ])('%p can get messages', async (backend, createSdk) => {
    // given
    const dappSdk = await createSdk();
    const dapp = await dappSdk.dapps.create({
      name: 'test',
      description: 'testtest',
    });
    const sdk = await createSdk();
    const address = await sdk.wallet.addresses.create({
      type: AddressType.Wallet,
      value: sdk.blockchainSdk.authenticationFacade.subject(),
    });
    await sdk.wallet.dappAddresses.create({
      dappAccountAddress: dapp.address,
      addressId: address.id,
      enabled: true,
    });
    const thread = await sdk.threads.create({
      me: {
        scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
      },
      otherMembers: [
        {
          address: dapp.address,
          scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
        },
      ],
      encrypted: false,
    });
    // when
    await dapp.messages.send({
      title: 'Test',
      message: 'Multicast',
      recipients: [sdk.wallet.address],
    });
    await dapp.messages.send({
      title: 'Test',
      message: 'Unicast',
      recipient: sdk.wallet.address,
    });
    await dapp.messages.send({
      title: 'Test',
      message: 'Broadcast',
    });
    // then
    const messages = await thread.messages();
    expect(messages.map((it) => it.text)).toMatchObject(
      expect.arrayContaining(['Multicast', 'Unicast', 'Broadcast']),
    );
  });
});
