import { createSdk, getThreads } from './helpers';

(async () => {
  const sdk = createSdk();
  const threads = await getThreads(sdk);
  console.log({threads});
  console.log(sdk.info.config);
})();
