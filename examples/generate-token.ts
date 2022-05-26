import { Token } from '../src';
import { EmbeddedWallet } from '../src/wallet';
import { Duration } from 'luxon';

const wallet = EmbeddedWallet.create();

(async () => {
  const token = await Token.generate(
    wallet,
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
})();
