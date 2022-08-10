import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import type {
  CreateThreadCommand,
  Messaging,
  SendMessageCommand,
} from '@messaging/messaging.interface';
import { ThreadMemberScope } from '@messaging/messaging.interface';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { DataServiceMessaging } from '@messaging/internal/data-service-messaging';
import { DataServiceApi } from '@data-service-api/data-service-api';
import { TokenProvider } from '@auth/token-provider';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/signers/ed25519-token-signer';
import { SolanaMessaging } from '@messaging/internal/solana-messaging';
import { createDialectProgram } from '@messaging/internal/solana-dialect-program-factory';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { programs } from '@dialectlabs/web3';
import { ThreadAlreadyExistsError } from '@sdk/errors';
import { DialectWalletAdapterEncryptionKeysProvider } from '@encryption/internal/encryption-keys-provider';

interface WalletMessagingState {
  adapter: DialectWalletAdapterWrapper;
  messaging: Messaging;
}

interface MessagingState {
  wallet1: WalletMessagingState;
  wallet2: WalletMessagingState;
  wallet3: WalletMessagingState;
}

const baseUrl = 'http://localhost:8080';

describe('Data service messaging (e2e)', () => {
  const messaging: [string, () => Promise<MessagingState>][] = [
    [DataServiceMessaging.name, () => createDataServiceMessaging()],
    [SolanaMessaging.name, () => createSolanaServiceMessaging()],
  ];

  it.each(messaging)(
    '%p can list all threads',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { messaging: wallet1Messaging },
      } = await messagingFactory();
      // when
      const threads = await wallet1Messaging.findAll();
      // then
      expect(threads).toMatchObject([]);
    },
  );

  it.each(messaging)(
    '%p can list all threads when treads created',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
        wallet3: { adapter: wallet3Adapter, messaging: wallet3Messaging },
      } = await messagingFactory();
      // when
      const command: Omit<CreateThreadCommand, 'otherMembers'> = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      };
      const fstToSnd = await wallet1Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const sndToTrd = await wallet2Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet3Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const trdToFst = await wallet3Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet1Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const fstThreads = (await wallet1Messaging.findAll()).map((it) => it.id);
      const sndThreads = (await wallet2Messaging.findAll()).map((it) => it.id);
      const trdThreads = (await wallet3Messaging.findAll()).map((it) => it.id);
      // then
      expect(fstThreads).toMatchObject(
        expect.arrayContaining([trdToFst.id, fstToSnd.id]),
      );
      expect(sndThreads).toMatchObject(
        expect.arrayContaining([fstToSnd.id, sndToTrd.id]),
      );
      expect(trdThreads).toMatchObject(
        expect.arrayContaining([sndToTrd.id, trdToFst.id]),
      );
    },
  );

  it.each(messaging)(
    '%p can find one thread by address when treads created',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
        wallet3: { adapter: wallet3Adapter, messaging: wallet3Messaging },
      } = await messagingFactory();
      const command: Omit<CreateThreadCommand, 'otherMembers'> = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      };
      const fstToSnd = await wallet1Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const sndToTrd = await wallet2Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet3Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const trdToFst = await wallet3Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet1Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      // when
      const fstToSndFound = (
        await wallet1Messaging.find({
          id: fstToSnd.id,
        })
      )?.id!;
      const sndToTrdFound = (
        await wallet2Messaging.find({
          id: sndToTrd.id,
        })
      )?.id!;
      const trdToFstFound = (
        await wallet3Messaging.find({
          id: trdToFst.id,
        })
      )?.id!;
      // then
      expect(fstToSnd.id).toMatchObject(fstToSndFound);
      expect(sndToTrd.id).toMatchObject(sndToTrdFound);
      expect(trdToFst.id).toMatchObject(trdToFstFound);
    },
  );

  it.each(messaging)(
    '%p cannot find one thread by address when not a member',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
        wallet3: { adapter: wallet3Adapter, messaging: wallet3Messaging },
      } = await messagingFactory();
      const command: Omit<CreateThreadCommand, 'otherMembers'> = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      };
      const fstToSnd = await wallet1Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const sndToTrd = await wallet2Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet3Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const trdToFst = await wallet3Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet1Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      // when
      const fstToSndFound = await wallet3Messaging.find({
        id: fstToSnd.id,
      });
      const sndToTrdFound = await wallet1Messaging.find({
        id: sndToTrd.id,
      });
      const trdToFstFound = await wallet2Messaging.find({
        id: trdToFst.id,
      });
      // then
      expect(fstToSndFound).toBeNull();
      expect(sndToTrdFound).toBeNull();
      expect(trdToFstFound).toBeNull();
    },
  );

  it.each(messaging)(
    '%p cannot find one thread by other member when not a member',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
        wallet3: { adapter: wallet3Adapter, messaging: wallet3Messaging },
      } = await messagingFactory();
      const command: Omit<CreateThreadCommand, 'otherMembers'> = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      };
      await wallet1Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      await wallet2Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet3Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      // when
      const trdToFst = await wallet3Messaging.find({
        otherMembers: [wallet1Adapter.publicKey],
      });
      const fstToTrd = await wallet1Messaging.find({
        otherMembers: [wallet3Adapter.publicKey],
      });
      // then
      expect(trdToFst).toBeNull();
      expect(fstToTrd).toBeNull();
    },
  );

  it.each(messaging)(
    '%p can find one thread by other member when treads created',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
        wallet3: { adapter: wallet3Adapter, messaging: wallet3Messaging },
      } = await messagingFactory();
      const command: Omit<CreateThreadCommand, 'otherMembers'> = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
      };
      const fstToSnd = await wallet1Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const sndToTrd = await wallet2Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet3Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      const trdToFst = await wallet3Messaging.create({
        ...command,
        otherMembers: [
          {
            publicKey: wallet1Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      });
      // when
      const fstToSndFound = (
        await wallet1Messaging.find({
          otherMembers: [wallet2Adapter.publicKey],
        })
      )?.id!;
      const sndToTrdFound = (
        await wallet2Messaging.find({
          otherMembers: [wallet3Adapter.publicKey],
        })
      )?.id!;
      const trdToFstFound = (
        await wallet3Messaging.find({
          otherMembers: [wallet1Adapter.publicKey],
        })
      )?.id!;
      // then
      expect(fstToSnd.id).toMatchObject(fstToSndFound);
      expect(sndToTrd.id).toMatchObject(sndToTrdFound);
      expect(trdToFst.id).toMatchObject(trdToFstFound);
    },
  );

  it.each(messaging)(
    '%p can create thread',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter },
      } = await messagingFactory();
      const before = await wallet1Messaging.findAll();
      expect(before).toMatchObject([]);
      // when
      const command: CreateThreadCommand = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      };
      const thread = await wallet1Messaging.create(command);
      // then
      expect(thread).not.toBeNull();
    },
  );

  it.each(messaging)(
    '%p cannot create 2nd thread with same members',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter },
      } = await messagingFactory();
      const before = await wallet1Messaging.findAll();
      expect(before).toMatchObject([]);
      // when
      const command: CreateThreadCommand = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      };
      const thread = await wallet1Messaging.create(command);
      // then
      expect(thread).not.toBeNull();
      await expect(wallet1Messaging.create(command)).rejects.toEqual(
        new ThreadAlreadyExistsError(),
      );
    },
  );

  it.each(messaging)(
    '%p cannot create encrypted thread if encryption not supported',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter },
      } = await messagingFactory();
      const before = await wallet1Messaging.findAll();
      expect(before).toMatchObject([]);
      // when
      const command: CreateThreadCommand = {
        encrypted: true,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      };
      // @ts-ignore
      wallet1Adapter.delegate.diffieHellman = undefined;
      // then
      await expect(wallet1Messaging.create(command)).rejects.toBeTruthy();
    },
  );

  it.each(messaging)(
    '%p admin can delete thread',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
      } = await messagingFactory();
      const command: CreateThreadCommand = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      };
      const thread = await wallet1Messaging.create(command);
      const actual = await wallet2Messaging.find(thread);
      expect(actual).not.toBe(null);
      await thread.delete();
      const afterDeletion = await wallet2Messaging.find(thread);
      expect(afterDeletion).toBe(null);
    },
  );

  it.each(messaging)(
    '%p can find all threads after creating',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter },
      } = await messagingFactory();
      // when
      const command: CreateThreadCommand = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      };
      await wallet1Messaging.create(command);
      const wallet1Dialects = await wallet1Messaging.findAll();
      const wallet2Dialects = await wallet1Messaging.findAll();
      // then
      expect(wallet1Dialects.length).toBe(1);
      expect(wallet2Dialects.length).toBe(1);
    },
  );

  it.each(messaging)(
    '%p can send/receive message when thread is unencrypted',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
      } = await messagingFactory();
      const command: CreateThreadCommand = {
        encrypted: false,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      };
      // when
      const wallet1Dialect = await wallet1Messaging.create(command);
      const wallet2Dialect = (await wallet2Messaging.find(wallet1Dialect))!;
      await wallet1Dialect.send({
        text: 'Hello world 💬',
      });
      await wallet2Dialect.send({
        text: 'Hello',
      });
      // then
      const wallet1Messages = await wallet1Dialect.messages();
      const wallet2Messages = await wallet2Dialect.messages();
      console.log(wallet1Messages);
      expect(wallet1Messages.length).toBe(2);
      expect(wallet2Messages.length).toBe(2);
      expect(new Set(wallet1Messages)).toMatchObject(new Set(wallet2Messages));
    },
  );

  it.each(messaging)(
    '%p can send/receive message when thread is encrypted',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
      } = await messagingFactory();
      const command: CreateThreadCommand = {
        encrypted: true,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      };
      // when
      const wallet1Dialect = await wallet1Messaging.create(command);
      const wallet2Dialect = (await wallet2Messaging.find(wallet1Dialect))!;
      const sendMessageCommand: SendMessageCommand = {
        text: 'Hello world 💬',
      };
      await wallet1Dialect.send(sendMessageCommand);
      // then
      const wallet1Messages = await wallet1Dialect.messages();
      const wallet2Messages = await wallet2Dialect.messages();
      console.log(wallet1Messages);
      expect(wallet1Messages.length).toBe(1);
      expect(wallet1Messages[0]).toMatchObject(sendMessageCommand);
      expect(new Set(wallet1Messages)).toMatchObject(new Set(wallet2Messages));
    },
  );

  it.each(messaging)(
    '%p can send message, but cannot read it if wallet does ont support encryption',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
      } = await messagingFactory();
      // @ts-ignore
      wallet2Adapter.delegate.diffieHellman = undefined;
      const command: CreateThreadCommand = {
        encrypted: true,
        me: {
          scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
        },
        otherMembers: [
          {
            publicKey: wallet2Adapter.publicKey,
            scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
          },
        ],
      };
      // when
      const wallet1Dialect = await wallet1Messaging.create(command);
      const wallet2Dialect = (await wallet2Messaging.find(wallet1Dialect))!;
      const sendMessageCommand: SendMessageCommand = {
        text: 'Hello world 💬',
      };
      await wallet1Dialect.send(sendMessageCommand);
      // then
      expect(wallet1Dialect.encryptionEnabled).toBeTruthy();
      expect(wallet1Dialect.canBeDecrypted).toBeTruthy();
      const wallet1Messages = await wallet1Dialect.messages();
      const wallet2Messages = await wallet2Dialect.messages();
      expect(wallet2Dialect.encryptionEnabled).toBeTruthy();
      expect(wallet2Dialect.canBeDecrypted).toBeFalsy();
      expect(wallet1Messages.length).toBe(1);
      expect(wallet1Messages[0]).toMatchObject(sendMessageCommand);
      expect(wallet2Messages.length).toBe(0);
    },
  );
});

async function createSolanaServiceMessaging() {
  const [wallet1, wallet2, wallet3] = await Promise.all([
    createSolanaWalletMessagingState(),
    createSolanaWalletMessagingState(),
    createSolanaWalletMessagingState(),
  ]);

  const solanaMessagingState: MessagingState = {
    wallet1,
    wallet2,
    wallet3,
  };
  return solanaMessagingState;
}

async function createSolanaWalletMessagingState(): Promise<WalletMessagingState> {
  const walletAdapter = new DialectWalletAdapterWrapper(
    NodeDialectWalletAdapter.create(),
  );
  const program = await createDialectProgram(
    walletAdapter,
    new PublicKey(programs['localnet'].programAddress),
    programs['localnet'].clusterAddress,
  );
  const airdropRequest = await program.provider.connection.requestAirdrop(
    walletAdapter.publicKey,
    LAMPORTS_PER_SOL * 100,
  );
  await program.provider.connection.confirmTransaction(airdropRequest);
  const userSolanaMessaging = SolanaMessaging.create(walletAdapter, program);
  return {
    adapter: walletAdapter,
    messaging: userSolanaMessaging,
  };
}

function createDataServiceWalletMessagingState(): WalletMessagingState {
  const wallet = NodeDialectWalletAdapter.create();
  const adapter = new DialectWalletAdapterWrapper(wallet);
  const messaging = new DataServiceMessaging(
    adapter.publicKey,
    DataServiceApi.create(
      baseUrl,
      TokenProvider.create(new DialectWalletAdapterEd25519TokenSigner(adapter)),
    ).threads,
    new DialectWalletAdapterEncryptionKeysProvider(adapter),
  );
  return {
    adapter: adapter,
    messaging: messaging,
  };
}

async function createDataServiceMessaging() {
  const wallet1 = createDataServiceWalletMessagingState();
  const wallet2 = createDataServiceWalletMessagingState();
  const wallet3 = createDataServiceWalletMessagingState();
  const dataServiceMessagingState: MessagingState = {
    wallet1,
    wallet2,
    wallet3,
  };
  return dataServiceMessagingState;
}
