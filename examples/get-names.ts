import { createSdk } from './helpers';

(async () => {
  const sdk = createSdk();
  const testPK = '14EEGLkAskxJyhnR1LNqmnGY9MkgQHxfXuik2SpnjYjN';
  const SNSName = sdk.nameService.getSNSNameByPublicKey(testPK);
  console.log(SNSName);
})();
