import { TokenProvider } from '@auth/internal/token-provider';
import type { PublicKey } from '@solana/web3.js';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import { DataServiceApi } from '@data-service-api/data-service-api';
import { DataServiceWallets } from '@wallet/internal/data-service-wallets';
import type { Wallets } from '@wallet/wallet.interface';
import { AddressType } from '@address/addresses.interface';

describe('Data service wallet api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  describe('Addresses', () => {
    let walletAdapter: DialectWalletAdapterWrapper;
    let wallet: Wallets;
    let dapps: DataServiceDappsApi;
    let dappPublicKey: PublicKey;

    beforeEach(async () => {
      walletAdapter = new DialectWalletAdapterWrapper(
        NodeDialectWalletAdapter.create(),
      );
      wallet = new DataServiceWallets(
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
      dapps = DataServiceApi.create(
        baseUrl,
        TokenProvider.create(
          new DialectWalletAdapterEd25519TokenSigner(dappWalletAdapter),
        ),
      ).dapps;
      await dapps.create({
        publicKey: dappPublicKey.toBase58(),
      });
    });

    test('can create address', async () => {
      // when
      const address = await wallet.addresses.create({
        dappPublicKey,
        type: AddressType.Wallet,
        enabled: true,
        value: wallet.publicKey.toBase58(),
      });
      // then
      expect(address).not.toBe(null);
    });

    test('can get address', async () => {
      // given
      const address = await wallet.addresses.create({
        dappPublicKey,
        type: AddressType.Wallet,
        enabled: true,
        value: wallet.publicKey.toBase58(),
      });
      // when
      const dappAddresses = await wallet.addresses.findAll({ dappPublicKey });
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

    test('can delete address', async () => {
      // given
      const address = await wallet.addresses.create({
        dappPublicKey,
        type: AddressType.Wallet,
        enabled: true,
        value: wallet.publicKey.toBase58(),
      });
      const dappAddresses = await wallet.addresses.findAll({ dappPublicKey });
      expect(dappAddresses.length).toBe(1);
      // when
      await wallet.addresses.delete({
        addressId: dappAddresses[0]?.address.id!,
      });
      const dappAddressesAfterDeletion = await wallet.addresses.findAll({
        dappPublicKey,
      });
      // then
      expect(dappAddressesAfterDeletion.length).toBe(0);
    });
  });
});
