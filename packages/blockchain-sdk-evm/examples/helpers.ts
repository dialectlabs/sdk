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
} from '@dialectlabs/sdk';
import type { Evm } from '../src';
import { EvmSdkFactory, NodeDialectEvmWalletAdapter } from '../src';

export function createEvmSdk(): DialectSdk<Evm> {
  const environment: DialectCloudEnvironment = 'local-development';

  return Dialect.sdk(
    {
      environment,
    },
    EvmSdkFactory.create({
      // IMPORTANT: must set environment variable DIALECT_SDK_CREDENTIALS
      // to your dapp's evm messaging wallet keypair
      wallet: NodeDialectEvmWalletAdapter.create(
        '5def27fc04234e83d8984fa1f1e951f460ed24e7bb284b0015b8123b7acbb2d0',
      ),
    }),
  );
}

export async function createEvmThread(
  sdk: DialectSdk<Evm>,
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

export async function getEvmThreads(sdk: DialectSdk<Evm>): Promise<Thread[]> {
  return await sdk.threads.findAll();
}

export async function getEvmMessages(sdk: DialectSdk<Evm>, threadId: ThreadId) {
  return getMessages(sdk, threadId);
}

export async function sendMessage(thread: Thread, text: string): Promise<void> {
  const command: SendMessageCommand = {
    text,
  };
  return await thread.send(command);
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
