import { AptosAccount } from 'aptos';
import type { Thread } from '../src';
import {
  createAptosSdk,
  createAptosThread,
  getAptosMessages,
  getAptosThreads,
  sendMessage,
} from './helpers';

(async () => {
  const sdk = createAptosSdk();
  const recipient = new AptosAccount().pubKey().toString();
  const thread_ = await createAptosThread(sdk, recipient);
  await sendMessage(thread_, 'gm');
  const threads = await getAptosThreads(sdk);
  if (threads.length < 1 || !threads[0]) {
    console.log(
      'You have no threads. Try creating a thread and sending a message first.',
    );
    return;
  }
  const thread: Thread = threads[0];
  await getAptosMessages(sdk, thread.id);
})();
