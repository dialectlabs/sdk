import { Token } from '../src';
import { EmbeddedDialectWalletAdapter } from '../src/wallet';
import { Duration } from 'luxon';

const wallet = EmbeddedDialectWalletAdapter.create();

(async () => {
  const token = await Token.generate(
    wallet,
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
