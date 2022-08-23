import {
  Auth,
  DialectWalletAdapterEd25519TokenSigner,
  DialectWalletAdapterWrapper,
  NodeDialectWalletAdapter,
} from '../src';
import { Duration } from 'luxon';

const adapter = NodeDialectWalletAdapter.create();
const walletAdapter = DialectWalletAdapterWrapper.create(adapter);

(async () => {
  const token = await Auth.tokens.generate(
    new DialectWalletAdapterEd25519TokenSigner(walletAdapter),
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
