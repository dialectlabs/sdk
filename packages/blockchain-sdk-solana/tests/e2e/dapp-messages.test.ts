import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  AddressType,
  BlockchainType,
  Dialect,
  ThreadMemberScope,
} from '@dialectlabs/sdk';
import { NodeDialectSolanaWalletAdapter, SolanaSdkFactory } from '../../src';

function sdkFactory(backend: 'dialect-cloud') {
  return async () => {
    const wallet = NodeDialectSolanaWalletAdapter.create(Keypair.generate());
    const solanaSdkFactory = SolanaSdkFactory.create({
      wallet,
    });
    const dialectSdk = Dialect.sdk(
      {
        environment: 'local-development',
      },
      solanaSdkFactory,
    );
    return dialectSdk;
  };
}

describe('Dapp messages (e2e)', () => {
  it.each([['dialect-cloud', sdkFactory('dialect-cloud')]])(
    '%p can get messages',
    async (backend, createSdk) => {
      // given
      const dappSdk = await createSdk();
      const dapp = await dappSdk.dapps.create({
        name: 'test',
        description: 'testtest',
        blockchainType: BlockchainType.SOLANA,
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
      await expect(
        dapp.messages.send({
          title: 'Test',
          message: 'Multicast',
          recipients: [sdk.wallet.address],
        }),
      ).resolves;
      await expect(
        dapp.messages.send({
          title: 'Test',
          message: 'Unicast',
          recipient: sdk.wallet.address,
        }),
      ).resolves;
      await expect(
        dapp.messages.send({
          title: 'Test',
          message: 'Broadcast',
        }),
      ).resolves;
      // then
    },
  );
});
