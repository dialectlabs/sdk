import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { Backend, Dialect, DialectSdk } from '@sdk/sdk.interface';
import { ThreadMemberScope } from '@messaging/messaging.interface';
import { Keypair } from '@solana/web3.js';

function createSdk() {
  return Dialect.sdk({
    wallet: NodeDialectWalletAdapter.create(),
    backends: [Backend.DialectCloud],
    environment: 'local-development',
  });
}
function createThread(sdk: DialectSdk, receiver: DialectSdk) {
  return sdk.threads.create({
    encrypted: false,
    me: {
      scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
    },
    otherMembers: [
      {
        publicKey: receiver.info.wallet.publicKey!,
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
    ],
  });
}

describe('Wallet dapp messages (e2e)', () => {
  test('can find all dapp messages', async () => {
    // given
    const dapp1Sdk = createSdk();
    await dapp1Sdk.dapps.create({
      name: 'test',
    });
    const dapp2Sdk = createSdk();
    await dapp2Sdk.dapps.create({
      name: 'test',
    });
    const sdk1 = createSdk();
    const sdk2 = createSdk();
    // when
    const dapp1Sdk1Thread = await createThread(dapp1Sdk, sdk1);
    await dapp1Sdk1Thread.send({ text: 'dapp1Sdk1Thread' });
    const dapp1Sdk2Thread = await createThread(dapp1Sdk, sdk2);
    await dapp1Sdk2Thread.send({ text: 'dapp1Sdk2Thread' });
    const dapp2Sdk1Thread = await createThread(dapp2Sdk, sdk1);
    await dapp2Sdk1Thread.send({ text: 'dapp2Sdk1Thread' });
    const dapp2Sdk2Thread = await createThread(dapp2Sdk, sdk2);
    await dapp2Sdk2Thread.send({ text: 'dapp2Sdk2Thread' });
    // then
    const sdk1Messages = await sdk1.wallet.messages.findAllFromDapps({
      dappVerified: false,
    });
    expect(sdk1Messages.length).toBe(2);
    expect(sdk1Messages.map((it) => it.text)).toMatchObject(
      expect.arrayContaining(['dapp1Sdk1Thread', 'dapp2Sdk1Thread']),
    );
    const sdk2Messages = await sdk2.wallet.messages.findAllFromDapps({
      dappVerified: false,
    });
    expect(sdk2Messages.length).toBe(2);
    expect(sdk2Messages.map((it) => it.text)).toMatchObject(
      expect.arrayContaining(['dapp1Sdk2Thread', 'dapp2Sdk2Thread']),
    );
  });
});
