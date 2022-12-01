import { TokenProvider } from '../../src/auth/token-provider';
import { DataServiceApi } from '../../src/dialect-cloud-api/data-service-api';
import type {
  CreateAddressCommandDto,
  DataServiceWalletAddressesApi,
  PatchAddressCommandDto,
} from '../../src/dialect-cloud-api/data-service-wallet-addresses-api';
import {
  AddressDto,
  AddressTypeDto,
} from '../../src/dialect-cloud-api/data-service-dapps-api';
import { Ed25519AuthenticationFacadeFactory } from '../../src/auth/ed25519/ed25519-authentication-facade-factory';
import { Ed25519TokenSigner } from '../../src/auth/ed25519/ed25519-token-signer';
import type { AccountAddress } from '../../src/auth/auth.interface';
import { DataServiceApiFactory } from '../../src/dialect-cloud-api/data-service-api-factory';
import { DataServiceWalletsApiClientV1 } from '../../src/dialect-cloud-api/data-service-wallets-api.v1';

describe('Data service wallet addresses api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let userAccountAddress: AccountAddress;
  let api: DataServiceWalletAddressesApi;

  beforeEach(() => {
    const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    userAccountAddress = authenticationFacade.subject();
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    api = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(authenticationFacade, dataServiceWalletsApiV1),
    ).walletAddresses;
  });

  test('can create wallet address', async () => {
    // when
    const command: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: userAccountAddress.toString(),
    };
    const created: AddressDto = await api.create(command);
    // then
    const addressDtoExpected: AddressDto = {
      id: expect.any(String),
      type: command.type,
      value: command.value,
      verified: true,
      wallet: {
        id: expect.any(String),
        publicKey: userAccountAddress.toString(),
      },
    };
    expect(created).toMatchObject(addressDtoExpected);
  });

  test('can get wallet address by id after creating', async () => {
    // given
    const command: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: userAccountAddress.toString(),
    };
    const created: AddressDto = await api.create(command);
    // when
    const found = await api.find(created.id);
    // then
    const addressDtoExpected: AddressDto = {
      id: expect.any(String),
      type: command.type,
      value: command.value,
      verified: true,
      wallet: {
        id: expect.any(String),
        publicKey: userAccountAddress.toString(),
      },
    };
    expect(found).toMatchObject(addressDtoExpected);
  });

  test('can find wallet addresses after creating', async () => {
    // given
    const command1: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: userAccountAddress.toString(),
    };
    await api.create(command1);
    const command2: CreateAddressCommandDto = {
      type: AddressTypeDto.Email,
      value: 'alexey@dialect.to',
    };
    await api.create(command2);
    // when
    const found = await api.findAll();
    // then
    const addressDto1Expected: AddressDto = {
      id: expect.any(String),
      type: command1.type,
      value: command1.value,
      verified: true,
      wallet: {
        id: expect.any(String),
        publicKey: userAccountAddress.toString(),
      },
    };
    const addressDto2Expected: AddressDto = {
      id: expect.any(String),
      type: command2.type,
      value: command2.value,
      verified: false,
      wallet: {
        id: expect.any(String),
        publicKey: userAccountAddress.toString(),
      },
    };
    expect(found).toMatchObject(
      expect.arrayContaining([addressDto1Expected, addressDto2Expected]),
    );
  });

  test('can patch wallet address after creating', async () => {
    // given
    const createCommand: CreateAddressCommandDto = {
      type: AddressTypeDto.Email,
      value: 'alexey@dialect.to',
    };
    const createdAddressDto = await api.create(createCommand);
    // when
    const patchCommand: PatchAddressCommandDto = {
      value: 'alexey-dev@dialect.to',
    };
    const patched = await api.patch(createdAddressDto.id, patchCommand);
    const foundAfterPatch = await api.find(patched.id);
    // then
    const addressDtoExpected: AddressDto = {
      id: expect.any(String),
      type: createCommand.type,
      value: patchCommand.value!,
      verified: false,
      wallet: {
        id: expect.any(String),
        publicKey: userAccountAddress.toString(),
      },
    };
    expect(patched).toMatchObject(addressDtoExpected);
    expect(foundAfterPatch).toMatchObject(addressDtoExpected);
  });

  test('can delete wallet address', async () => {
    // given
    const createCommand: CreateAddressCommandDto = {
      type: AddressTypeDto.Email,
      value: 'alexey@dialect.to',
    };
    const createdAddressDto = await api.create(createCommand);
    // when
    await api.delete(createdAddressDto.id);
    // then
    await expect(api.find(createdAddressDto.id)).rejects.toBeTruthy();
  });

  test('can verify wallet address', async () => {
    // given
    const createCommand: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: userAccountAddress.toString(),
    };
    const createdAddressDto = await api.create(createCommand);
    // when
    const verifiedAddressDto = await api.verify(createdAddressDto.id, {
      code: '228228',
    });
    // then
    const addressDtoExpected: AddressDto = {
      id: expect.any(String),
      type: createCommand.type,
      value: createCommand.value!,
      verified: true,
      wallet: {
        id: expect.any(String),
        publicKey: userAccountAddress.toString(),
      },
    };
    expect(verifiedAddressDto).toMatchObject(addressDtoExpected);
  });

  test('can resend verification code for wallet address', async () => {
    // given
    const createCommand: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: userAccountAddress.toString(),
    };
    const createdAddressDto = await api.create(createCommand);
    // when
    await expect(
      api.resendVerificationCode(createdAddressDto.id),
    ).resolves.toBeTruthy();
  });
});
