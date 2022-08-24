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
  test('by default there are no unread messages', async () => {
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
    const user1GeneralSummary = await user1.threads.findSummaryAll();
    const user2GeneralSummary = await user2.threads.findSummaryAll();
    // then
    expect(user1Summary!.me.hasUnreadMessages).toBeFalsy();
    expect(user1Summary!.me.unreadMessagesCount).toBe(0);
    expect(user2Summary!.me.hasUnreadMessages).toBeFalsy();
    expect(user2Summary!.me.unreadMessagesCount).toBe(0);
    expect(user1GeneralSummary!.unreadMessagesCount).toBe(0);
    expect(user2GeneralSummary!.unreadMessagesCount).toBe(0);
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
    const user1GeneralSummary = await user1.threads.findSummaryAll();
    const user2GeneralSummary = await user2.threads.findSummaryAll();
    // then
    expect(user1Summary!.me.hasUnreadMessages).toBeFalsy();
    expect(user1Summary!.me.unreadMessagesCount).toBe(0);
    expect(user2Summary!.me.hasUnreadMessages).toBeTruthy();
    expect(user2Summary!.me.unreadMessagesCount).toBe(1);
    expect(user1GeneralSummary!.unreadMessagesCount).toBe(0);
    expect(user2GeneralSummary!.unreadMessagesCount).toBe(1);
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
    const user1GeneralSummary = await user1.threads.findSummaryAll();
    const user2GeneralSummary = await user2.threads.findSummaryAll();
    // then
    expect(user1Summary!.me.hasUnreadMessages).toBeTruthy();
    expect(user1Summary!.me.unreadMessagesCount).toBe(1);
    expect(user2Summary!.me.hasUnreadMessages).toBeTruthy();
    expect(user1Summary!.me.unreadMessagesCount).toBe(1);
    expect(user1GeneralSummary!.unreadMessagesCount).toBe(1);
    expect(user2GeneralSummary!.unreadMessagesCount).toBe(1);
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
    const user2GeneralSummaryBefore = await user2.threads.findSummaryAll();
    expect(user2SummaryBefore!.me.hasUnreadMessages).toBeTruthy();
    expect(user2SummaryBefore!.me.unreadMessagesCount).toBe(1);
    expect(user2GeneralSummaryBefore!.unreadMessagesCount).toBe(1);
    // when
    const user2Thread = await user2.threads.find(user1Thread);
    const messages = await user2Thread!.messages();
    const theOnlyMessage = messages[0]!;
    await user2Thread!.setLastReadMessageTime(theOnlyMessage.timestamp);
    const user2SummaryAfter = await user2.threads.findSummary({
      otherMembers: [user1.wallet.publicKey],
    });
    const user2GeneralSummaryAfter = await user2.threads.findSummaryAll();
    // then
    expect(user2SummaryAfter!.me.hasUnreadMessages).toBeFalsy();
    expect(user2SummaryAfter!.me.unreadMessagesCount).toBe(0);
    expect(user2GeneralSummaryAfter!.unreadMessagesCount).toBe(0);
  });
});

describe('Wallet multi-thread read messages', () => {
  test('when user has unread messages from 2 threads, after reading from one, still sees unread messages amount from the other one', async () => {
    // given
    const mainUser = createSdk();

    const user1 = createSdk();
    const user2 = createSdk();

    const user1Thread = await user1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: mainUser.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });

    const user2Thread = await user2.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: mainUser.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });

    await user1Thread.send({
      text: 'foo',
    });

    await user2Thread.send({
      text: 'bar',
    });

    const mainUserGeneralSummaryBefore = await mainUser.threads.findSummaryAll();
    const mainUserThread1SummaryBefore = await mainUser.threads.findSummary({ otherMembers: [user1.wallet.publicKey] });
    const mainUserThread2SummaryBefore = await mainUser.threads.findSummary({ otherMembers: [user2.wallet.publicKey] });

    expect(mainUserThread1SummaryBefore!.me.unreadMessagesCount).toBe(1);
    expect(mainUserThread2SummaryBefore!.me.unreadMessagesCount).toBe(1);
    expect(mainUserGeneralSummaryBefore!.unreadMessagesCount).toBe(2);
    // when
    const mainUserPovThread2 = await mainUser.threads.find(user2Thread);
    const messages = await mainUserPovThread2!.messages();
    const theOnlyMessage = messages[0]!;
    await mainUserPovThread2!.setLastReadMessageTime(theOnlyMessage.timestamp);
    // then
    const mainUserGeneralSummaryAfter = await mainUser.threads.findSummaryAll();
    const mainUserThread1SummaryAfter = await mainUser.threads.findSummary({ otherMembers: [user1.wallet.publicKey] });
    const mainUserThread2SummaryAfter = await mainUser.threads.findSummary({ otherMembers: [user2.wallet.publicKey] });

    expect(mainUserThread1SummaryAfter!.me.unreadMessagesCount).toBe(1);
    expect(mainUserThread2SummaryAfter!.me.unreadMessagesCount).toBe(0);
    expect(mainUserGeneralSummaryAfter!.unreadMessagesCount).toBe(1);
  })
});
