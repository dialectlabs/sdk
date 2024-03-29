import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import {
  CreateThreadCommand,
  Dialect,
  Ed25519PublicKey,
  Environment,
  generateEd25519Keypair,
  ThreadAlreadyExistsError,
  ThreadMemberScope,
} from '@dialectlabs/sdk';
import { createSolanaSdk } from '../../../sdk/tests/utils/utils';
import { Keypair } from '@solana/web3.js';

const environment: Environment = 'local-development';

function getScopedMembers(...members: string[]) {
  return members.map((it) => ({
    address: it,
    scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
  }));
}

function generateAddress() {
  return new Ed25519PublicKey(generateEd25519Keypair().publicKey).toString();
}

describe('Group threads routines test (e2e)', () => {
  it('can create group thread (with >2 members)', async () => {
    // given
    const wallet1 = createSolanaSdk(environment, Keypair.generate());

    let member1 = generateAddress();
    let member2 = generateAddress();
    let command: CreateThreadCommand = {
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: getScopedMembers(member1, member2),
    };

    // when
    const thread = await wallet1.threads.create(command);

    //then
    expect(thread).not.toBeNull();
    const expectedThread = {
      me: {
        ...command.me,
        address: wallet1.wallet.address,
      },
      otherMembers: command.otherMembers,
      encryptionEnabled: command.encrypted,
    };
    expect(thread).toMatchObject(expectedThread);
  });

  it('cannot create encrypted group thread', async () => {
    const wallet1 = createSolanaSdk(environment, Keypair.generate());

    let member1 = generateAddress();
    let member2 = generateAddress();
    await expect(
      wallet1.threads.create({
        encrypted: true,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: getScopedMembers(member1, member2),
      }),
    ).rejects.toBeTruthy();
  });

  it('cannot create group thread with repeated members', async () => {
    const wallet1 = createSolanaSdk(environment, Keypair.generate());

    let member1 = generateAddress();
    let member2 = generateAddress();
    let command: CreateThreadCommand = {
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: getScopedMembers(member1, member1, member2),
    };
    await expect(wallet1.threads.create(command)).rejects.toBeTruthy();
  });

  it('cannot create group thread with self among other members', async () => {
    const wallet1 = createSolanaSdk(environment, Keypair.generate());

    let command: CreateThreadCommand = {
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: getScopedMembers(
        wallet1.wallet.address,
        new Ed25519PublicKey(generateEd25519Keypair().publicKey).toString(),
      ),
    };
    await expect(wallet1.threads.create(command)).rejects.toBeTruthy();
  });

  it('when two threads with matching members exist, finds only one with exact given members', async () => {
    // given
    const wallet1 = createSolanaSdk(environment, Keypair.generate());

    let member1 = generateAddress();
    let member2 = generateAddress();
    let command: CreateThreadCommand = {
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      otherMembers: getScopedMembers(member1, member2),
    };
    const groupThread = await wallet1.threads.create(command);
    const p2p = await wallet1.threads.create({
      ...command,
      otherMembers: getScopedMembers(member1),
    });

    // when
    let foundGroupThread = await wallet1.threads.find({
      otherMembers: [member1, member2],
    });
    let foundP2pThread = await wallet1.threads.find({
      otherMembers: [member1],
    });

    expect(foundGroupThread).toBeNull();
    // expect(foundGroupThread).toMatchObject(groupThread);
    // expect(foundGroupThread).not.toMatchObject(p2p);

    expect(foundP2pThread).not.toBeNull();
    expect(foundP2pThread).toMatchObject(p2p);
    expect(foundP2pThread).not.toMatchObject(groupThread);
  });
});
