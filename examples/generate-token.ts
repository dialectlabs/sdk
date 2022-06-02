import { Auth } from '../src';
import { NodeDialectWalletAdapter } from '../src';
import { Duration } from 'luxon';
import { DialectWalletAdapterEd25519TokenSigner } from '../src';

const walletAdapter = NodeDialectWalletAdapter.create();

(async () => {
  const token = await Auth.tokens.generate(
    new DialectWalletAdapterEd25519TokenSigner(walletAdapter),
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
