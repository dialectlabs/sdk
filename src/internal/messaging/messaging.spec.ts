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
import { TokenProvider } from '@auth/internal/token-provider';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';
import { DialectWalletAdapterEncryptionKeysProvider } from '@encryption/encryption-keys-provider';
import { SolanaMessaging } from '@messaging/internal/solana-messaging';
import { createDialectProgram } from '@messaging/internal/solana-dialect-program-factory';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { programs } from '@dialectlabs/web3';

interface WalletMessagingState {
  adapter: DialectWalletAdapterWrapper;
  messaging: Messaging;
}

interface MessagingState {
  wallet1: WalletMessagingState;
  wallet2: WalletMessagingState;
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
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
      } = await messagingFactory();
      // when
      const threads = await wallet1Messaging.findAll();
      // then
      expect(threads).toMatchObject([]);
    },
  );

  it.each(messaging)(
    '%p can create thread',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
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
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
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
      await expect(wallet1Messaging.create(command)).rejects.toBeTruthy();
    },
  );

  it.each(messaging)(
    '%p cannot create encrypted thread if encryption not supported',
    async (messagingType, messagingFactory) => {
      // given
      const {
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
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
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
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
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
        wallet2: { adapter: wallet2Adapter, messaging: wallet2Messaging },
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
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
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
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
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
        wallet1: { adapter: wallet1Adapter, messaging: wallet1Messaging },
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
  const [wallet1, wallet2] = await Promise.all([
    createSolanaWalletMessagingState(),
    createSolanaWalletMessagingState(),
  ]);

  const solanaMessagingState: MessagingState = {
    wallet1,
    wallet2,
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

async function createDataServiceMessaging() {
  const user1Wallet = NodeDialectWalletAdapter.create();
  const user1WalletAdapter = new DialectWalletAdapterWrapper(user1Wallet);
  const user2Wallet = NodeDialectWalletAdapter.create();
  const user2WalletAdapter = new DialectWalletAdapterWrapper(user2Wallet);
  const user1DataServiceMessaging = new DataServiceMessaging(
    user1WalletAdapter.publicKey,
    DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(user1WalletAdapter),
      ),
    ).threads,
    new DialectWalletAdapterEncryptionKeysProvider(user1WalletAdapter),
  );
  const user2DataServiceMessaging = new DataServiceMessaging(
    user2WalletAdapter.publicKey,
    DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(user2WalletAdapter),
      ),
    ).threads,
    new DialectWalletAdapterEncryptionKeysProvider(user2WalletAdapter),
  );
  const dataServiceMessagingState: MessagingState = {
    wallet1: {
      adapter: user1WalletAdapter,
      messaging: user1DataServiceMessaging,
    },
    wallet2: {
      adapter: user2WalletAdapter,
      messaging: user2DataServiceMessaging,
    },
  };
  return dataServiceMessagingState;
}
