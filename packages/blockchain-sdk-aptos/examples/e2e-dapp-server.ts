import { Dialect, DialectSdk } from '@dialectlabs/sdk';
import { Aptos, AptosSdkFactory, NodeDialectAptosWalletAdapter } from '../src';
import { dappPrivateKey } from './e2e-shared';

const sdk: DialectSdk<Aptos> = Dialect.sdk(
  {
    environment: 'development',
  },
  AptosSdkFactory.create({
    wallet: NodeDialectAptosWalletAdapter.create(dappPrivateKey),
  }),
);

async function main() {
  const dapp = await bootstrapDapp();
  console.log('Start typing messages to send to the client...');
  process.stdin.on('readable', () => {
    let message;
    while ((message = process.stdin.read()) !== null) {
      console.log(`Sending message ${message}...`);
      dapp.messages
        .send({
          title: 'New notification',
          message: message.toString(),
        })
        .catch((e) => console.error(e));
    }
  });
}

main().catch((e) => console.error(e));

async function bootstrapDapp() {
  const dapp = await getOrCreateDapp();
  console.log(`Dapp: ${dapp.name} (address: ${dapp.address})`);
  return dapp;
}

async function getOrCreateDapp() {
  const dapp = await sdk.dapps.find();
  if (!dapp) {
    console.log(`Dapp not found, creating...`);
    return sdk.dapps.create({
      name: 'Example dapp',
    });
  }
  return dapp;
}
