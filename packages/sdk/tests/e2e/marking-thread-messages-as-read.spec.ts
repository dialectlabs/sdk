import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import type { Thread } from '@dialectlabs/sdk';
import { Dialect, ThreadMemberScope } from '@dialectlabs/sdk';

describe('Marking thread messages as read test (e2e)', () => {
  test('can mark message as read', async () => {
    // given
    const senderSdk = Dialect.sdk(
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
    const thread = await senderSdk.threads.create({
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
    const summary = await receiverSdk.threads.findSummary({
      otherMembers: [senderSdk.wallet.address],
    });
    expect(summary?.me?.unreadMessagesCount).toBe(1);
    // when
    const receiverThread: Thread = (await receiverSdk.threads.find({
      id: thread.id,
    }))!;
    await receiverThread.markAsRead();
    const summaryAfterMarking = await receiverSdk.threads.findSummary({
      otherMembers: [senderSdk.wallet.address],
    });
    // then
    expect(summaryAfterMarking?.me?.unreadMessagesCount).toBe(0);
  });
});
