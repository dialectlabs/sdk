import {
  Dialect,
  Environment,
  ResourceAlreadyExistsError,
  ThreadMemberScope,
} from '@dialectlabs/sdk';
import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import { createSolanaSdk } from '../../../sdk/tests/utils/utils';
import { Keypair } from '@solana/web3.js';

const environment: Environment = 'local-development';

describe('Data-service-specific: messages deduplication id  (e2e)', () => {
  it('allows saving a deduplication id for a sent message', async () => {
    // given
    const wallet1 = createSolanaSdk(environment, Keypair.generate());
    const wallet2 = createSolanaSdk(environment, Keypair.generate());

    const thread = await wallet1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          address: wallet2.wallet.address,
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
      otherMembers: [wallet2.wallet.address],
    });
    const [onlyMessage] = (await sameThread?.messages()) ?? [];

    // then
    expect(onlyMessage?.text).toBe('Hello World');
    expect(onlyMessage?.deduplicationId).toBe('some_random_id_1');
  });

  it('allows messages in different threads have the same deduplication id', async () => {
    // given
    const wallet1 = createSolanaSdk(environment, Keypair.generate());
    const wallet2 = createSolanaSdk(environment, Keypair.generate());
    const wallet3 = createSolanaSdk(environment, Keypair.generate());

    const thread1 = await wallet1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          address: wallet2.wallet.address,
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
          address: wallet3.wallet.address,
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
      otherMembers: [wallet2.wallet.address],
    });
    const refetchedThread2 = await wallet1.threads.find({
      otherMembers: [wallet3.wallet.address],
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
    const wallet1 = createSolanaSdk(environment, Keypair.generate());
    const wallet2 = createSolanaSdk(environment, Keypair.generate());

    const thread = await wallet1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          address: wallet2.wallet.address,
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
