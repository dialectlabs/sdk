import { Token } from '../src';
import { EmbeddedWalletAdapter } from '../src/wallet';
import { Duration } from 'luxon';

const wallet = EmbeddedWalletAdapter.create();

(async () => {
  const token = await Token.generate(
    wallet,
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
