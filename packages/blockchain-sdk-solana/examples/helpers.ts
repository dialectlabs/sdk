import {
  BlockchainSdk,
  CreateThreadCommand,
  Dialect,
  DialectCloudEnvironment,
  DialectSdk,
  FindThreadByIdQuery,
  SendMessageCommand,
  Thread,
  ThreadId,
  ThreadMemberScope,
  ThreadMessage,
} from '@dialectlabs/sdk';
import type { Solana } from '../src';
import { NodeDialectSolanaWalletAdapter, SolanaSdkFactory } from '../src';

export function createSolanaSdk(): DialectSdk<Solana> {
  const environment: DialectCloudEnvironment = 'local-development';

  return Dialect.sdk(
    {
      environment,
    },
    SolanaSdkFactory.create({
      // IMPORTANT: must set environment variable DIALECT_SDK_CREDENTIALS
      // to your dapp's Solana messaging wallet keypair e.g. [170,23, . . . ,300]
      wallet: NodeDialectSolanaWalletAdapter.create(),
    }),
  );
}

export async function createSolanaThread(
  sdk: DialectSdk<Solana>,
  recipient: string,
): Promise<Thread> {
  const command: CreateThreadCommand = {
    encrypted: false,
    me: {
      scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
    },
    otherMembers: [
      {
        address: recipient,
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
    ],
  };
  const thread = await sdk.threads.create(command);
  console.log({ thread });
  return thread;
}

export async function sendMessage(thread: Thread, text: string): Promise<void> {
  const command: SendMessageCommand = {
    text,
  };
  return await thread.send(command);
}

export async function getSolanaThreads(
  sdk: DialectSdk<Solana>,
): Promise<Thread[]> {
  return await sdk.threads.findAll();
}

export async function getSolanaMessages(
  sdk: DialectSdk<Solana>,
  threadId: ThreadId,
): Promise<ThreadMessage[]> {
  return getMessages(sdk, threadId);
}

async function getMessages(sdk: DialectSdk<BlockchainSdk>, threadId: ThreadId) {
  const query: FindThreadByIdQuery = {
    id: threadId,
  };
  const thread = await sdk.threads.find(query);
  if (!thread) {
    console.log('No thread found with id', threadId);
    return [];
  }
  console.log({ thread });
  const messages = await thread.messages();
  console.log({ messages });
  return messages;
}
