import { DataServiceApi } from './data-service-api';
import { TokenProvider } from '@auth/internal/token-provider';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import type {
  CreateAddressCommandV0,
  DappAddressDtoV0,
  DataServiceWalletsApiV0,
} from '@data-service-api/data-service-wallets-api.v0';

describe('Data service dapps api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let dappWallet: DialectWalletAdapterWrapper;
  let dappsApi: DataServiceDappsApi;

  beforeEach(() => {
    dappWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    dappsApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(dappWallet),
      ),
    ).dapps;
  });

  test('can create dapp and find all dappAddresses', async () => {
    // when
    const dappPublicKey = dappWallet.publicKey.toBase58();
    const dappDto = await dappsApi.create({
      publicKey: dappPublicKey,
    });
    console.log(dappDto);
    const addresses = await dappsApi.findAllDappAddresses();
    // then
    expect(addresses).toMatchObject([]);
  });

  describe('Wallet dapp addresses v0', () => {
    let wallet: DialectWalletAdapterWrapper;
    let wallets: DataServiceWalletsApiV0;
    let dapps: DataServiceDappsApi;

    beforeEach(() => {
      wallet = new DialectWalletAdapterWrapper(
        NodeDialectWalletAdapter.create(),
      );
      const dataServiceApi = DataServiceApi.create(
        baseUrl,
        TokenProvider.create(
          new DialectWalletAdapterEd25519TokenSigner(wallet),
        ),
      );
      wallets = dataServiceApi.walletsV0;
      dapps = dataServiceApi.dapps;
    });

    test('can create dapp address', async () => {
      // given
      const dapp = await dapps.create({
        publicKey: wallet.publicKey.toBase58(),
      });
      // when
      const createDappAddressCommand: CreateAddressCommandV0 = {
        type: 'wallet',
        enabled: true,
        value: wallet.publicKey.toBase58(),
      };
      const dappAddressDtoV0 = await wallets.createDappAddress(
        createDappAddressCommand,
        dapp.publicKey,
      );
      // then
      const expected: Omit<DappAddressDtoV0, 'addressId' | 'id'> = {
        type: 'wallet',
        enabled: true,
        dapp: dapp.publicKey,
        verified: true,
        value: wallet.publicKey.toBase58(),
      };
      expect(dappAddressDtoV0).toMatchObject(expected);
    });

    test('can find dapp address', async () => {
      // given
      const dapp = await dapps.create({
        publicKey: wallet.publicKey.toBase58(),
      });
      const createDappAddressCommand: CreateAddressCommandV0 = {
        type: 'wallet',
        enabled: true,
        value: wallet.publicKey.toBase58(),
      };
      await wallets.createDappAddress(createDappAddressCommand, dapp.publicKey);
      // when
      const dappAddressDtoV0s = await wallets.findAllDappAddresses(
        dapp.publicKey,
      );
      // then
      const expected: Omit<DappAddressDtoV0, 'addressId' | 'id' | 'value'> = {
        type: 'wallet',
        enabled: true,
        dapp: dapp.publicKey,
        verified: true,
      };
      expect(dappAddressDtoV0s).toMatchObject([expected]);
    });

    test('can delete dapp address', async () => {
      // given
      const dapp = await dapps.create({
        publicKey: wallet.publicKey.toBase58(),
      });
      const createDappAddressCommand: CreateAddressCommandV0 = {
        type: 'wallet',
        enabled: true,
        value: wallet.publicKey.toBase58(),
      };
      const addressDtoV0 = await wallets.createDappAddress(
        createDappAddressCommand,
        dapp.publicKey,
      );
      // when
      await wallets.deleteDappAddress({ id: addressDtoV0.addressId });
      const dappAddressDtoV0s = await wallets.findAllDappAddresses(
        dapp.publicKey,
      );
      // then
      expect(dappAddressDtoV0s).toMatchObject([]);
    });
  });
});
