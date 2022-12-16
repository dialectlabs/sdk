import {
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

import {
  Evm,
  EvmSdkFactory,
  NodeDialectEvmWalletAdapter,
} from '@dialectlabs/blockchain-sdk-evm';

export function createEvmSdk(): DialectSdk<Evm> {
  const environment: DialectCloudEnvironment = 'local-development';

  const sdk = Dialect.sdk(
    {
      environment,
    },
    EvmSdkFactory.create({
      // IMPORTANT: must set environment variable DIALECT_SDK_CREDENTIALS
      // to your dapp's Aptos messaging wallet keypair
      wallet: NodeDialectEvmWalletAdapter.create(),
    }),
  );

  return sdk;
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
