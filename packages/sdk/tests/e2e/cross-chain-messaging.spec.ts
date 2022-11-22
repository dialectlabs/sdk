import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import {
  AptosSdkFactory,
  NodeDialectAptosWalletAdapter,
} from '@dialectlabs/blockchain-sdk-aptos';
import { Dialect, Environment, ThreadMemberScope } from '@dialectlabs/sdk';
import { createSolanaSdk, createAptosSdk } from '../../../sdk/tests/utils/utils';
import { Keypair } from '@solana/web3.js';
import { randomBytes } from 'tweetnacl';

const environment: Environment = 'local-development';

describe('Cross-chain messaging tests (e2e)', () => {
  test('can create token', async () => {
    // given
    const solanaSdk = createSolanaSdk(environment, Keypair.generate());
    const aptosSdk = createAptosSdk(environment, Uint8Array.from(randomBytes(32)));
    // when
    const solanaThread = await solanaSdk.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
      },
      otherMembers: [
        {
          address: aptosSdk.wallet.address,
          scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
        },
      ],
    });
    await solanaThread.send({
      text: 'Hello from Solana!',
    });
    const aptosThread = (await aptosSdk.threads.find({
      id: solanaThread.id,
    }))!;
    await aptosThread.send({
      text: 'Hello from Aptos!',
    });
    const solanaThreadMessages = await solanaThread.messages();
    const aptosThreadMessages = await aptosThread.messages();
    // then
    expect(solanaThreadMessages.length).toBe(2);
    expect(aptosThreadMessages.length).toBe(2);
    expect(solanaThreadMessages).toStrictEqual(aptosThreadMessages);
  });
});
