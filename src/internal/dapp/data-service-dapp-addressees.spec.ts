import { TokenProvider } from '@auth/internal/token-provider';
import type { PublicKey } from '@solana/web3.js';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import { DataServiceApi } from '@data-service-api/data-service-api';
import { DataServiceWallet } from '@wallet/internal/data-service-wallet';
import type { Wallet } from '@wallet/wallet.interface';
import { AddressType } from '@address/addresses.interface';
import { DappsImpl } from '@dapp/internal/dapp';
import { DataServiceDappAddresses } from '@dapp/internal/data-service-dapp-addresses';
import type { Dapps } from '@dapp/dapp.interface';

describe('Data service dapps api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  describe('Addresses', () => {
    let walletAdapter: DialectWalletAdapterWrapper;
    let wallet: Wallet;
    let dapps: Dapps;
    let dappPublicKey: PublicKey;

    beforeEach(async () => {
      walletAdapter = new DialectWalletAdapterWrapper(
        NodeDialectWalletAdapter.create(),
      );
      wallet = new DataServiceWallet(
        walletAdapter.publicKey,
        DataServiceApi.create(
          baseUrl,
          TokenProvider.create(
            new DialectWalletAdapterEd25519TokenSigner(walletAdapter),
          ),
        ).walletsV0,
      );
      const dappWalletAdapter = new DialectWalletAdapterWrapper(
        NodeDialectWalletAdapter.create(),
      );
      dappPublicKey = dappWalletAdapter.publicKey;
      const dappsApi = DataServiceApi.create(
        baseUrl,
        TokenProvider.create(
          new DialectWalletAdapterEd25519TokenSigner(dappWalletAdapter),
        ),
      ).dapps;

      dapps = new DappsImpl(
        dappPublicKey,
        new DataServiceDappAddresses(dappsApi),
        dappsApi,
      );
      await dapps.create({
        publicKey: dappPublicKey,
      });
    });

    test('can list addresses', async () => {
      // given
      const address = await wallet.addresses.create({
        dappPublicKey,
        type: AddressType.Wallet,
        enabled: true,
        value: wallet.publicKey.toBase58(),
      });
      // when
      const dapp = await dapps.find();
      const dappAddresses = await dapp.dappAddresses.findAll();
      // then
      const expected = {
        enabled: address.enabled,
        address: {
          verified: true,
          value: walletAdapter.publicKey.toBase58(),
          type: AddressType.Wallet,
          wallet: {
            publicKey: walletAdapter.publicKey,
          },
        },
      };
      expect(dappAddresses.length).toBe(1);
      expect(dappAddresses[0]).toMatchObject(expected);
    });
  });
});
