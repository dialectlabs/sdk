import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { Backend, Dialect } from '@sdk/sdk.interface';
import { ThreadMemberScope } from '@messaging/messaging.interface';

function createSdk() {
  return Dialect.sdk({
    wallet: NodeDialectWalletAdapter.create(),
    backends: [Backend.DialectCloud],
    environment: 'local-development',
  });
}

describe('Wallet messages read messages', () => {
  test('by default there re no unread messages', async () => {
    // given
    const user1 = createSdk();
    const user2 = createSdk();
    const thread = await user1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: user2.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });
    // when
    const user1Summary = await user1.threads.findSummary({
      otherMembers: [user2.wallet.publicKey],
    });
    const user2Summary = await user2.threads.findSummary({
      otherMembers: [user1.wallet.publicKey],
    });
    // then
    expect(user1Summary!.me.hasUnreadMessages).toBeFalsy();
    expect(user2Summary!.me.hasUnreadMessages).toBeFalsy();
  });

  test('when message is sent but not read then there are unread messages', async () => {
    // given
    const user1 = createSdk();
    const user2 = createSdk();
    const thread = await user1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: user2.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });
    // when
    await thread.send({
      text: 'foo',
    });
    const user1Summary = await user1.threads.findSummary({
      otherMembers: [user2.wallet.publicKey],
    });
    const user2Summary = await user2.threads.findSummary({
      otherMembers: [user1.wallet.publicKey],
    });
    // then
    expect(user1Summary!.me.hasUnreadMessages).toBeFalsy();
    expect(user2Summary!.me.hasUnreadMessages).toBeTruthy();
  });

  test('when message is sent by both members but not read then there are unread messages for both', async () => {
    // given
    const user1 = createSdk();
    const user2 = createSdk();
    const user1Thread = await user1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: user2.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });
    // when
    await user1Thread.send({
      text: 'foo',
    });
    const user2Thread = await user2.threads.find(user1Thread);
    await user2Thread!.send({
      text: 'bar',
    });
    const user1Summary = await user1.threads.findSummary({
      otherMembers: [user2.wallet.publicKey],
    });
    const user2Summary = await user2.threads.findSummary({
      otherMembers: [user1.wallet.publicKey],
    });
    // then
    expect(user1Summary!.me.hasUnreadMessages).toBeTruthy();
    expect(user2Summary!.me.hasUnreadMessages).toBeTruthy();
  });

  test('when message is sent and read by other member then there are no unread', async () => {
    // given
    const user1 = createSdk();
    const user2 = createSdk();
    const user1Thread = await user1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: user2.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });
    await user1Thread.send({
      text: 'foo',
    });
    const user2SummaryBefore = await user2.threads.findSummary({
      otherMembers: [user1.wallet.publicKey],
    });
    expect(user2SummaryBefore!.me.hasUnreadMessages).toBeTruthy();
    // when
    const user2Thread = await user2.threads.find(user1Thread);
    const messages = await user2Thread!.messages();
    const theOnlyMessage = messages[0]!;
    await user2Thread!.setLastReadMessageTime(theOnlyMessage.timestamp);
    const user2SummaryAfter = await user2.threads.findSummary({
      otherMembers: [user1.wallet.publicKey],
    });
    // then
    expect(user2SummaryAfter!.me.hasUnreadMessages).toBeFalsy();
  });
});
