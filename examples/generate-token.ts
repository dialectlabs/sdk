import { DialectWalletEd25519TokenSigner, AuthTokenUtils } from '../src';
import { NodeDialectWalletAdapter } from '../src/node-dialect-wallet-adapter';
import { Duration } from 'luxon';

const walletAdapter = NodeDialectWalletAdapter.create();

(async () => {
  const token = await AuthTokenUtils.generate(
    new DialectWalletEd25519TokenSigner(walletAdapter),
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
