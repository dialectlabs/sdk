import type {
  CreateDappAddressCommandDto,
  DataServiceWalletDappAddressesApi,
  PartialUpdateDappAddressCommandDto,
} from '../../src/dialect-cloud-api/data-service-wallet-dapp-addresses-api';
import {
  AddressDto,
  AddressTypeDto,
  DappAddressDto,
  DappDto,
  DataServiceDappsApi,
} from '../../src/dialect-cloud-api/data-service-dapps-api';
import { TokenProvider } from '../../src/auth/token-provider';
import { DataServiceApi } from '../../src/dialect-cloud-api/data-service-api';
import { Ed25519AuthenticationFacadeFactory } from '../../src/auth/ed25519/ed25519-authentication-facade-factory';
import { Ed25519TokenSigner } from '../../src/auth/ed25519/ed25519-token-signer';
import type { AccountAddress } from '../../src/auth/auth.interface';
import { DataServiceApiFactory } from '../../src/dialect-cloud-api/data-service-api-factory';
import { DataServiceWalletsApiClientV1 } from '../../src/dialect-cloud-api/data-service-wallets-api.v1';

describe('Data service wallet addresses api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let userAddress: AccountAddress;
  let walletDappAddressesApi: DataServiceWalletDappAddressesApi;

  let dappAddress: AccountAddress;
  let dappApi: DataServiceDappsApi;

  let dappDto: DappDto;
  let walletAddress: AddressDto;

  beforeEach(async () => {
    const userAuthenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    userAddress = userAuthenticationFacade.subject();
    const userDataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    const walletDataServiceApi = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(userAuthenticationFacade, userDataServiceWalletsApiV1),
    );
    walletDappAddressesApi = walletDataServiceApi.walletDappAddresses;

    const dappAuthenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    dappAddress = dappAuthenticationFacade.subject();
    const dappDataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    dappApi = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(dappAuthenticationFacade, dappDataServiceWalletsApiV1),
    ).dapps;
    dappDto = await dappApi.create({
      name: 'Test dapp',
    });
    walletAddress = await walletDataServiceApi.walletAddresses.create({
      type: AddressTypeDto.Wallet,
      value: userAddress.toString(),
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
