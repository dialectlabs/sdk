import type {
  DialectSdk,
  Thread,
} from '../src';
import { createSdk } from './create-sdk';

export async function getThreads(sdk: DialectSdk): Promise<Thread[]> {
  const threads: Thread[] = await sdk.threads.findAll();
  return threads;
}

(async () => {
  const sdk = createSdk();
  const threads = await getThreads(sdk);
  console.log({threads});
  console.log(sdk.info.config);
})();
