import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import {
  AptosSdkFactory,
  NodeDialectAptosWalletAdapter,
} from '@dialectlabs/blockchain-sdk-aptos';
import { Dialect, ThreadMemberScope } from '@dialectlabs/sdk';

describe('Cross-chain messaging tests (e2e)', () => {
  test('can create token', async () => {
    // given
    const solanaSdk = Dialect.sdk(
      {
        environment: 'local-development',
      },
      SolanaSdkFactory.create({
        wallet: NodeDialectSolanaWalletAdapter.create(),
      }),
    );
    const aptosSdk = Dialect.sdk(
      {
        environment: 'local-development',
      },
      AptosSdkFactory.create({
        wallet: NodeDialectAptosWalletAdapter.create(),
      }),
    );
    // when
    const solanaThread = await solanaSdk.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
      },
      otherMembers: [
        {
          address: aptosSdk.wallet.address,
          scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
        },
      ],
    });
    await solanaThread.send({
      text: 'Hello from Solana!',
    });
    const aptosThread = (await aptosSdk.threads.find({
      id: solanaThread.id,
    }))!;
    await aptosThread.send({
      text: 'Hello from Aptos!',
    });
    const solanaThreadMessages = await solanaThread.messages();
    const aptosThreadMessages = await aptosThread.messages();
    // then
    expect(solanaThreadMessages.length).toBe(2);
    expect(aptosThreadMessages.length).toBe(2);
    expect(solanaThreadMessages).toStrictEqual(aptosThreadMessages);
  });
});
