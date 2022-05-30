import { DialectWalletEd25519TokenSigner, Token } from '../src';
import { EmbeddedDialectWalletAdapter } from '../src/node-dialect-wallet-adapter';
import { Duration } from 'luxon';

const walletAdapter = EmbeddedDialectWalletAdapter.create();

(async () => {
  const token = await Token.generate(
    new DialectWalletEd25519TokenSigner(walletAdapter),
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
