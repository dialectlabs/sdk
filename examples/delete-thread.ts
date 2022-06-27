import { PublicKey } from '@solana/web3.js';
import { createSdk, createThread } from './helpers';
import type { FindThreadByIdQuery } from '../src';

(async () => {
  const sdk = createSdk();
  const recipient = new PublicKey('3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk') // Make this arbitrary
  const thread = await createThread(sdk, recipient);
  console.log({thread});
  const threadId = thread.id;
  await thread.delete();
  const query: FindThreadByIdQuery = {
    id: threadId,
  };
  const refetchedThread = await sdk.threads.find(query);
  console.log({refetchedThread});
})()
