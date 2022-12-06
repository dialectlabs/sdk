import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import { Dialect, Environment, ThreadMemberScope } from '@dialectlabs/sdk';
import { createSolanaSdk } from '../../../sdk/tests/utils/utils';
import { Keypair } from '@solana/web3.js';

const environment: Environment = 'local-development';

describe('Marking dapp messages as read test (e2e)', () => {
  let dappSdkKeypair: Keypair;
  let receiverSdkKeypair: Keypair;
  beforeEach(() => {
    dappSdkKeypair = Keypair.generate();
    receiverSdkKeypair = Keypair.generate();
  });
  test('can mark message as read', async () => {
    // given
    const dappSdk = createSolanaSdk(environment, dappSdkKeypair);
    const receiverSdk = createSolanaSdk(environment, receiverSdkKeypair);
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
