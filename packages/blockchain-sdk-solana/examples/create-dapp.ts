import { BlockchainType, Dialect } from '../../sdk';
import { NodeDialectSolanaWalletAdapter, Solana, SolanaSdkFactory } from '..';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

async function main() {
  const monitor = Dialect.sdk<Solana>(
    {
      // environment: 'development',
      environment: 'development',
    },
    SolanaSdkFactory.create({
      wallet: new NodeDialectSolanaWalletAdapter(
        Keypair.fromSecretKey(
          new Uint8Array([
            56, 111, 31, 152, 56, 138, 122, 34, 150, 99, 14, 65, 41, 148, 28,
            58, 223, 101, 10, 31, 12, 146, 175, 132, 212, 6, 19, 222, 92, 177,
            36, 123, 65, 246, 202, 251, 197, 105, 179, 188, 65, 163, 200, 12,
            235, 148, 133, 28, 213, 61, 233, 180, 235, 110, 52, 2, 94, 136, 193,
            46, 225, 253, 48, 144,
          ]),
        ),
      ),
    }),
  );
  const uint8Array = new Uint8Array([
    248, 80, 183, 221, 66, 144, 97, 254, 75, 101, 186, 117, 33, 130, 91, 117,
    214, 195, 11, 209, 227, 230, 64, 138, 128, 91, 90, 248, 47, 46, 201, 100, 4,
    1, 253, 87, 233, 66, 232, 136, 133, 117, 185, 11, 43, 114, 187, 61, 35, 102,
    45, 78, 9, 6, 60, 136, 233, 210, 41, 32, 18, 228, 241, 182,
  ]);

  const s = bs58.encode(uint8Array);
  console.log(s);
  return;
  const monitor2 = Dialect.sdk<Solana>(
    {
      // environment: 'development',
      environment: 'development',
    },
    SolanaSdkFactory.create({
      wallet: new NodeDialectSolanaWalletAdapter(
        Keypair.fromSecretKey(uint8Array),
      ),
    }),
  );

  const monitorDapp = await monitor.dapps.find();
  if (!monitorDapp) {
    const created = await monitor.dapps.create({
      name: 'MONITOR 1',
      blockchainType: BlockchainType.SOLANA,
    });
  }

  const monitorDapp2 = await monitor2.dapps.find();
  if (!monitorDapp2) {
    const created = await monitor2.dapps.create({
      name: 'MONITOR 2',
      blockchainType: BlockchainType.SOLANA,
    });
  }

  const promise = await monitor2.threads.find({
    otherMembers: ['6tBUD4bQzNehG3hQVtVFaGxre2P8rQoH99pubRtgSbSb'],
  });

  console.log(promise?.lastMessage?.metadata);
  await monitorDapp2!.messages.send({
    title: 'Hello topic',
    message: 'Hello from monitor 2 topic',
    actions: [
      { label: 'so', url: 'https://so.com' },
      { label: 'sat', url: 'https://sat.com' },
    ],
    notificationTypeId: '9b153418-f804-498d-9ea3-08f62359032a',
  });
}

main().catch(console.error);
