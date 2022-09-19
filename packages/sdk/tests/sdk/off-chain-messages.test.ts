import { Keypair } from '@solana/web3.js';
import {
  Backend,
  CreateThreadCommand,
  Dialect,
  Ed25519PublicKey,
  NodeDialectWalletAdapter,
  ResourceAlreadyExistsError,
  ThreadMemberScope,
} from '../../src';

function createSdk() {
  return Dialect.sdk({
    wallet: NodeDialectWalletAdapter.create(),
    backends: [Backend.DialectCloud],
    environment: 'local-development',
  });
}

describe('Data-service-specific messaging (e2e)', () => {
  it('can create group thread (with >2 members)', async () => {
    // given
    const wallet1 = createSdk();

    let member1 = new Keypair().publicKey;
    let member2 = new Keypair().publicKey;
    let command: CreateThreadCommand = {
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: new Ed25519PublicKey(member1.toBase58()),
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        {
          publicKey: new Ed25519PublicKey(member2.toBase58()),
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    };

    // when
    const thread = await wallet1.threads.create(command);

    //then
    expect(thread).not.toBeNull();
    const expectedThread = {
      me: {
        ...command.me,
        publicKey: new Ed25519PublicKey(wallet1.wallet.publicKey.toString()),
      },
      otherMembers: command.otherMembers,
      encryptionEnabled: command.encrypted,
    };
    expect(thread).toMatchObject(expectedThread);
  });

  it('cannot create encrypted group thread', async () => {
    const wallet1 = createSdk();

    let member1 = new Keypair().publicKey;
    let member2 = new Keypair().publicKey;
    await expect(
      wallet1.threads.create({
        encrypted: true,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: member1,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
          {
            publicKey: member2,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  it('cannot create group thread with same members', async () => {
    // given
    const wallet1 = createSdk();

    let member1 = new Keypair().publicKey;
    let member2 = new Keypair().publicKey;
    const thread = await wallet1.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: member1,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        {
          publicKey: member2,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });
    expect(thread).not.toBeNull();

    //when
    await expect(
      wallet1.threads.create({
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: member1,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
          {
            publicKey: member2,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  it('cannot create group thread with repeated members', async () => {
    const wallet1 = createSdk();

    let member1 = new Keypair().publicKey;
    let member2 = new Keypair().publicKey;
    let command = {
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: member1,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        {
          publicKey: member1,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        {
          publicKey: member2,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    };
    await expect(wallet1.threads.create(command)).rejects.toBeTruthy();
  });

  it('cannot create group thread with self among other members', async () => {
    const wallet1 = createSdk();

    let command = {
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: new Keypair().publicKey,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        {
          publicKey: new Keypair().publicKey,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        {
          publicKey: wallet1.wallet.publicKey,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    };
    await expect(wallet1.threads.create(command)).rejects.toBeTruthy();
  });

  it('when two threads with matching members exist, finds only one with exact given members', async () => {
    // given
    const wallet1 = createSdk();

    let member1 = new Keypair().publicKey;
    let member2 = new Keypair().publicKey;
    let command = {
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: [
        {
          publicKey: member1,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        {
          publicKey: member2,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    };
    const groupThread = await wallet1.threads.create(command);
    const p2p = await wallet1.threads.create({
      ...command,
      otherMembers: [
        {
          publicKey: member1,
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      ],
    });

    // when
    let foundGroupThread = await wallet1.threads.find({
      otherMembers: [member1, member2],
    });
    let foundP2pThread = await wallet1.threads.find({
      otherMembers: [member1],
    });

    expect(foundGroupThread).not.toBeNull();
    expect(foundGroupThread).toMatchObject(groupThread);
    expect(foundGroupThread).not.toMatchObject(p2p);

    expect(foundP2pThread).not.toBeNull();
    expect(foundP2pThread).toMatchObject(p2p);
    expect(foundP2pThread).not.toMatchObject(groupThread);
  });

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
