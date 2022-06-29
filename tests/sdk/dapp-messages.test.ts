import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { Backend, Dialect } from '@sdk/sdk.interface';
import { AddressType } from '@address/addresses.interface';
import { ThreadMemberScope } from '@messaging/messaging.interface';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

function sdkFactory(backend: Backend) {
  return async () => {
    const wallet = NodeDialectWalletAdapter.create();
    const dialectSdk = Dialect.sdk({
      wallet: wallet,
      backends: [backend],
      environment: 'local-development',
    });
    if (backend === Backend.Solana) {
      const program = dialectSdk.info.solana.dialectProgram;
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
    [Backend.Solana, sdkFactory(Backend.Solana)],
    [Backend.DialectCloud, sdkFactory(Backend.DialectCloud)],
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
      value: sdk.info.config.wallet.publicKey?.toBase58()!,
    });
    await sdk.wallet.dappAddresses.create({
      dappPublicKey: dapp.publicKey,
      addressId: address.id,
      enabled: true,
    });
    const thread = await sdk.threads.create({
      me: {
        scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
      },
      otherMembers: [
        {
          publicKey: dapp.publicKey,
          scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
        },
      ],
      encrypted: false,
    });
    // when
    await dapp.messages.send({
      title: 'Test',
      message: 'Multicast',
      recipients: [sdk.info.wallet.publicKey!],
    });
    await dapp.messages.send({
      title: 'Test',
      message: 'Unicast',
      recipient: sdk.info.wallet.publicKey!,
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
