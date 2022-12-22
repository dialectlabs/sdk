import { createSolanaSdk, createSolanaThread } from './helpers';
import type { FindThreadByIdQuery } from '@dialectlabs/sdk';

(async () => {
  const sdk = createSolanaSdk();
  const recipient = '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk'; // Make this arbitrary
  const thread = await createSolanaThread(sdk, recipient);
  console.log({ thread });
  const threadId = thread.id;
  await thread.delete();
  const query: FindThreadByIdQuery = {
    id: threadId,
  };
  const refetchedThread = await sdk.threads.find(query);
  console.log({ refetchedThread });
})();
