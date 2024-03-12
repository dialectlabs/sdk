import { BlockchainType, Dialect, DialectSdk } from '../../sdk';
import { NodeDialectSolanaWalletAdapter, Solana, SolanaSdkFactory } from '..';
import { Keypair } from '@solana/web3.js';

async function getOrCreateDapp(monitor: DialectSdk<Solana>) {
  const monitorDapp = await monitor.dapps.find();
  if (!monitorDapp) {
    const created = await monitor.dapps.create({
      name: 'MONITOR 1',
      blockchainType: BlockchainType.SOLANA,
    });
    return created;
  }
  return monitorDapp;
}

async function main() {
  const sdk = Dialect.sdk<Solana>(
    {
      // environment: 'development',
      environment: 'development',
    },
    SolanaSdkFactory.create({
      wallet: new NodeDialectSolanaWalletAdapter(
        Keypair.fromSecretKey(
          new Uint8Array([
            248, 80, 183, 221, 66, 144, 97, 254, 75, 101, 186, 117, 33, 130, 91,
            117, 214, 195, 11, 209, 227, 230, 64, 138, 128, 91, 90, 248, 47, 46,
            201, 100, 4, 1, 253, 87, 233, 66, 232, 136, 133, 117, 185, 11, 43,
            114, 187, 61, 35, 102, 45, 78, 9, 6, 60, 136, 233, 210, 41, 32, 18,
            228, 241, 182,
          ]),
        ),
      ),
    }),
  );
  const dapp = await getOrCreateDapp(sdk);

  await dapp.messages.send({
    title: 'Hello topic 1',
    message: 'Hello from monitor 1 topic',
    actions: [
      { label: 'so', url: 'https://so.com' },
      { label: 'sat', url: 'https://sat.com' },
    ],
    notificationTypeId: '9b153418-f804-498d-9ea3-08f62359032a',
  });
  await dapp.messages.send({
    title: 'Hello topic 2',
    message: 'Hello from monitor 2 topic',
    actions: [
      { label: 'le', url: 'https://le.com' },
      { label: 'zhat', url: 'https://zhat.com' },
    ],
    notificationTypeId: 'dd20b141-ca09-4fde-9b36-19ac2560edca',
  });
}

main().catch(console.error);
