import {
  Auth,
  DialectWalletAdapterEd25519TokenSigner,
  DialectSolanaWalletAdapterWrapper,
  NodeDialectSolanaWalletAdapter,
} from '../src';
import { Duration } from 'luxon';

const adapter = NodeDialectSolanaWalletAdapter.create();
const walletAdapter = DialectSolanaWalletAdapterWrapper.create(adapter);

(async () => {
  const token = await Auth.tokens.generate(
    new DialectWalletAdapterEd25519TokenSigner(walletAdapter),
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
