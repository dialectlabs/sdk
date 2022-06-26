import { createSdk } from './create-sdk';
import { getThreads } from './get-threads';
import type { DialectSdk, FindThreadByIdQuery, Message, Thread, ThreadId } from '../src';
import { PublicKey } from '@solana/web3.js';

export async function getMessages(sdk: DialectSdk, threadId: ThreadId): Promise<Message[]> {
  const query: FindThreadByIdQuery = {
    id: threadId,
  }
  const thread = await sdk.threads.find(query);
  if (!thread) {
    console.log("No thread found with id", threadId);
    return [];
  }
  console.log({thread});
  const messages = await thread.messages();
  console.log({messages});
  return messages;
};

(async () => {
  const sdk = createSdk();
  const threads = await getThreads(sdk);
  console.log({threads});
  if (threads.length < 1 || !threads[0]) {
    console.log('You have no threads. Try creating a thread and sending a message first.');
    return;
  }
  const thread: Thread = threads[0];
  await getMessages(sdk, thread.id);
})();
