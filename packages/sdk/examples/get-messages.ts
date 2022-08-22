import type { Thread } from '../src';
import { createSdk, getMessages, getThreads } from './helpers';

(async () => {
  const sdk = createSdk();
  const threads = await getThreads(sdk);
  console.log({ threads });
  if (threads.length < 1 || !threads[0]) {
    console.log(
      'You have no threads. Try creating a thread and sending a message first.',
    );
    return;
  }
  const thread: Thread = threads[0];
  await getMessages(sdk, thread.id);
})();
