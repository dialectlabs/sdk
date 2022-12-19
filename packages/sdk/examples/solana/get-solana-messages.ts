import type { Thread } from '../../src';
import {
  createSolanaSdk,
  createSolanaThread,
  getSolanaMessages,
  getSolanaThreads,
  sendMessage,
} from '../helpers';

(async () => {
  const sdk = createSolanaSdk();
  const recipient = '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk'; // Make this arbitrary
  const thread_ = await createSolanaThread(sdk, recipient);
  await sendMessage(thread_, 'gm');
  const threads = await getSolanaThreads(sdk);
  console.log({ threads });
  if (threads.length < 1 || !threads[0]) {
    console.log(
      'You have no threads. Try creating a thread and sending a message first.',
    );
    return;
  }
  const thread: Thread = threads[0];
  await getSolanaMessages(sdk, thread.id);
})();
