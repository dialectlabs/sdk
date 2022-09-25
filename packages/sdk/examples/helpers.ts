import type { PublicKey } from '@solana/web3.js';
import {
  CreateThreadCommand,
  FindThreadByIdQuery,
  Thread,
  ThreadId,
  ThreadMessage,
  Dialect,
  DialectCloudEnvironment,
} from '@dialectlabs/sdk';
import {
  DialectSdk,
  SendMessageCommand,
  ThreadMemberScope,
} from '@dialectlabs/sdk';
import { Solana, SolanaSdkFactory, NodeDialectSolanaWalletAdapter } from '@dialectlabs/blockchain-sdk-solana';
import type {  } from '@dialectlabs/blockchain-sdk-solana';

export function createSolanaSdk(): DialectSdk<Solana> {
  const environment: DialectCloudEnvironment = 'local-development';

  const sdk = Dialect.sdk(
    {
      environment,
    },
    SolanaSdkFactory.create({
      wallet: NodeDialectSolanaWalletAdapter.create(),
    }),
  );

  return sdk;
}

export async function createSolanaThread(
  sdk: DialectSdk<Solana>,
  recipient: PublicKey,
): Promise<Thread> {
  const command: CreateThreadCommand = {
    encrypted: false,
    me: {
      scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
    },
    otherMembers: [
      {
        address: recipient.toBase58(),
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
    ],
  };
  const thread = await sdk.threads.create(command);
  console.log({ thread });
  return thread;
}

export async function sendSolanaMessage(thread: Thread, text: string): Promise<void> {
  const command: SendMessageCommand = {
    text,
  };
  return await thread.send(command);
}

export async function getSolanaThreads(sdk: DialectSdk<Solana>): Promise<Thread[]> {
  const threads: Thread[] = await sdk.threads.findAll();
  return threads;
}

export async function getSolanaMessages(
  sdk: DialectSdk<Solana>,
  threadId: ThreadId,
): Promise<ThreadMessage[]> {
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
