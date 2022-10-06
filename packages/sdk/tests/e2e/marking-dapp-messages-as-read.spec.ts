import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import { Dialect, ThreadMemberScope } from '@dialectlabs/sdk';

describe('Marking dapp messages as read test (e2e)', () => {
  test('can mark message as read', async () => {
    // given
    const dappSdk = Dialect.sdk(
      {
        environment: 'local-development',
      },
      SolanaSdkFactory.create({
        wallet: NodeDialectSolanaWalletAdapter.create(),
      }),
    );
    const receiverSdk = Dialect.sdk(
      {
        environment: 'local-development',
      },
      SolanaSdkFactory.create({
        wallet: NodeDialectSolanaWalletAdapter.create(),
      }),
    );
    await dappSdk.dapps.create({
      name: 'Marking dapp messages as read test (e2e)',
    });
    const thread = await dappSdk.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
      },
      otherMembers: [
        {
          address: receiverSdk.wallet.address,
          scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
        },
      ],
    });
    await thread.send({
      text: 'Hello from Solana!',
    });
    const summary = await receiverSdk.wallet.messages.dappMessagesSummary({
      dappVerified: false,
    });
    expect(summary.unreadMessagesCount).toBe(1);
    // when
    await receiverSdk.wallet.messages.markAllDappMessagesAsRead({
      dappVerified: false,
    });
    const summaryAfterMarking =
      await receiverSdk.wallet.messages.dappMessagesSummary({
        dappVerified: false,
      });
    // then
    expect(summaryAfterMarking?.unreadMessagesCount).toBe(0);
  });
});
