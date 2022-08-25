import { Dialect, NodeDialectWalletAdapter } from '../src';

async function main() {
  // const sdk = Dialect.sdk({
  //   wallet: NodeDialectWalletAdapter.create(),
  //   environment: 'local-development',
  // });
  //
  // const dapp1 = await sdk.dapps.create({
  //   name: 'at-testing-dapp',
  // });
  // console.log(dapp1.telegramUsername);
  const sdk2 = Dialect.sdk({
    wallet: NodeDialectWalletAdapter.create(),
    environment: 'local-development',
  });
  const dapp2 = await sdk2.dapps.create({
    name: 'at-testing-dapp-2',
    telegramBotConfiguration: {
      token: '5714139635:AAGTChhgfi4h8VE9HUuFNava9hY3H9TX9j',
    },
  });
  console.log(dapp2.telegramUsername);
}

main();
