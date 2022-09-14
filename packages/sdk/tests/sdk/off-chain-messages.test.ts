import { Backend, Dialect } from '@sdk/sdk.interface';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { ThreadMemberScope } from '@messaging/messaging.interface';
import { ResourceAlreadyExistsError } from '@sdk/errors';

function createSdk() {
  return Dialect.sdk({
    wallet: NodeDialectWalletAdapter.create(),
    backends: [Backend.DialectCloud],
    environment: 'local-development',
  });
}

describe('Data-service-specific messaging (e2e)', () => {
  it('allows saving a deduplication id for a sent message', async () => {
    // given
    const wallet1 = createSdk();
    const wallet2 = createSdk();

    const thread = await wallet1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: wallet2.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });

    // when
    await thread.send({
      text: 'Hello World',
      deduplicationId: 'some_random_id_1',
    });

    const sameThread = await wallet1.threads.find({
      otherMembers: [wallet2.wallet.publicKey],
    });
    const [onlyMessage] = (await sameThread?.messages()) ?? [];

    // then
    expect(onlyMessage?.text).toBe('Hello World');
    expect(onlyMessage?.deduplicationId).toBe('some_random_id_1');
  });

  it('allows messages in different threads have the same deduplication id', async () => {
    // given
    const wallet1 = createSdk();
    const wallet2 = createSdk();
    const wallet3 = createSdk();

    const thread1 = await wallet1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: wallet2.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });

    const thread2 = await wallet1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: wallet3.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });

    // given
    await thread1.send({
      text: 'Hello World!',
      deduplicationId: 'same_id',
    });

    await thread2.send({
      text: 'Hello World!',
      deduplicationId: 'same_id',
    });

    const refetchedThread1 = await wallet1.threads.find({
      otherMembers: [wallet2.wallet.publicKey],
    });
    const refetchedThread2 = await wallet1.threads.find({
      otherMembers: [wallet3.wallet.publicKey],
    });

    const [threadMessage1] = (await refetchedThread1?.messages()) ?? [];
    const [threadMessage2] = (await refetchedThread2?.messages()) ?? [];

    // then
    expect(threadMessage1?.deduplicationId).toBe('same_id');
    expect(threadMessage2?.deduplicationId).toBe('same_id');

    expect(threadMessage1?.text).toBe('Hello World!');
    expect(threadMessage2?.text).toBe('Hello World!');
  });

  it('throws an error if a message in the same thread contains the same deduplication id', async () => {
    // given
    const wallet1 = createSdk();
    const wallet2 = createSdk();

    const thread = await wallet1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: wallet2.info.wallet.publicKey!,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });

    // when
    await thread.send({
      text: 'Foo Bar',
      deduplicationId: 'some_random_id_1',
    });

    const sendDuplicateMessage = () =>
      thread.send({
        text: 'Foo Bar',
        deduplicationId: 'some_random_id_1',
      });

    // then
    expect(sendDuplicateMessage).rejects.toThrowError(
      ResourceAlreadyExistsError,
    );
  });
});
