import {
  Auth,
  DialectWalletAdapterEd25519TokenSigner,
  NodeDialectWalletAdapter,
} from '../src';
import { Duration } from 'luxon';
import { DialectWalletAdapterWrapper } from '../src/internal/wallet-adapter/dialect-wallet-adapter-wrapper';

const walletAdapter = new DialectWalletAdapterWrapper(
  NodeDialectWalletAdapter.create(),
);

(async () => {
  const token = await Auth.tokens.generate(
    new DialectWalletAdapterEd25519TokenSigner(walletAdapter),
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
