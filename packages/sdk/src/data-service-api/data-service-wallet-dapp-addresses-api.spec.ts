import type {
  CreateDappAddressCommandDto,
  DataServiceWalletDappAddressesApi,
  PartialUpdateDappAddressCommandDto,
} from './data-service-wallet-dapp-addresses-api';
import {
  AddressDto,
  AddressTypeDto,
  DappAddressDto,
  DappDto,
  DataServiceDappsApi,
} from './data-service-dapps-api';
import { TokenProvider } from '../core/auth/token-provider';
import { DialectWalletAdapterWrapper } from '../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../wallet-adapter/node-dialect-wallet-adapter';
import { DataServiceApi } from './data-service-api';
import { Ed25519AuthenticationFacadeFactory } from '../core/auth/ed25519/ed25519-authentication-facade-factory';
import { DialectWalletAdapterEd25519TokenSigner } from '../solana/auth/ed25519/ed25519-token-signer';

describe('Data service wallet addresses api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let wallet: DialectWalletAdapterWrapper;
  let walletDappAddressesApi: DataServiceWalletDappAddressesApi;

  let dappWallet: DialectWalletAdapterWrapper;
  let dappApi: DataServiceDappsApi;

  let dappDto: DappDto;
  let walletAddress: AddressDto;

  beforeEach(async () => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    const walletDataServiceApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new Ed25519AuthenticationFacadeFactory(
          new DialectWalletAdapterEd25519TokenSigner(wallet),
        ).get(),
      ),
    );
    walletDappAddressesApi = walletDataServiceApi.walletDappAddresses;
    dappWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    dappApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new Ed25519AuthenticationFacadeFactory(
          new DialectWalletAdapterEd25519TokenSigner(dappWallet),
        ).get(),
      ),
    ).dapps;
    dappDto = await dappApi.create({
      name: 'Test dapp',
    });
    walletAddress = await walletDataServiceApi.walletAddresses.create({
      type: AddressTypeDto.Wallet,
      value: wallet.publicKey.toBase58(),
    });
  });

  test('can create wallet dapp address', async () => {
    // when
    const command: CreateDappAddressCommandDto = {
      addressId: walletAddress.id,
      dappPublicKey: dappDto.publicKey,
      enabled: true,
    };
    const created: DappAddressDto = await walletDappAddressesApi.create(
      command,
    );
    // then
    const dappAddressDtoExpected: DappAddressDto = {
      id: expect.any(String),
      address: walletAddress,
      enabled: true,
    };
    expect(created).toMatchObject(dappAddressDtoExpected);
  });

  test('can get wallet dapp address by id after creating', async () => {
    // given
    const command: CreateDappAddressCommandDto = {
      addressId: walletAddress.id,
      dappPublicKey: dappDto.publicKey,
      enabled: true,
    };
    const created: DappAddressDto = await walletDappAddressesApi.create(
      command,
    );
    // when
    const foundDappAddress = await walletDappAddressesApi.find(created.id);
    // then
    const dappAddressDtoExpected: DappAddressDto = {
      id: expect.any(String),
      address: walletAddress,
      enabled: true,
    };
    expect(foundDappAddress).toMatchObject(dappAddressDtoExpected);
  });

  test('can find wallet dapp address after creating', async () => {
    // given
    const command: CreateDappAddressCommandDto = {
      addressId: walletAddress.id,
      dappPublicKey: dappDto.publicKey,
      enabled: true,
    };
    await walletDappAddressesApi.create(command);
    // when
    const foundDappAddresses = await walletDappAddressesApi.findAll();
    const foundDappAddressesByDappId = await walletDappAddressesApi.findAll({
      dappPublicKey: dappDto.publicKey,
    });
    const foundDappAddressesByAddressesId =
      await walletDappAddressesApi.findAll({
        addressIds: [walletAddress.id],
      });
    // then
    const dappAddressDtoExpected: DappAddressDto = {
      id: expect.any(String),
      address: walletAddress,
      enabled: true,
    };
    expect(foundDappAddresses).toMatchObject([dappAddressDtoExpected]);
    expect(foundDappAddressesByDappId).toMatchObject([dappAddressDtoExpected]);
    expect(foundDappAddressesByAddressesId).toMatchObject([
      dappAddressDtoExpected,
    ]);
  });

  test('can patch wallet dapp address after creating', async () => {
    // given
    const createDappAddressCommand: CreateDappAddressCommandDto = {
      addressId: walletAddress.id,
      dappPublicKey: dappDto.publicKey,
      enabled: true,
    };
    const created: DappAddressDto = await walletDappAddressesApi.create(
      createDappAddressCommand,
    );
    // when
    const patchCommand: PartialUpdateDappAddressCommandDto = {
      enabled: false,
    };
    const patched = await walletDappAddressesApi.patch(
      created.id,
      patchCommand,
    );
    const foundAfterPatch = await walletDappAddressesApi.find(patched.id);
    // then
    const dappAddressDtoExpected: DappAddressDto = {
      id: expect.any(String),
      address: walletAddress,
      enabled: false,
    };
    expect(patched).toMatchObject(dappAddressDtoExpected);
    expect(foundAfterPatch).toMatchObject(dappAddressDtoExpected);
  });

  test('can delete wallet dapp address', async () => {
    // given
    const createDappAddressCommand: CreateDappAddressCommandDto = {
      addressId: walletAddress.id,
      dappPublicKey: dappDto.publicKey,
      enabled: true,
    };
    const created: DappAddressDto = await walletDappAddressesApi.create(
      createDappAddressCommand,
    );
    // when
    await walletDappAddressesApi.delete(created.id);
    // then
    await expect(walletDappAddressesApi.find(created.id)).rejects.toBeTruthy();
  });
});
