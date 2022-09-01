import { TokenProvider } from '../../auth/token-provider';
import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../../wallet-adapter/node-dialect-wallet-adapter';
import { DataServiceApi } from './data-service-api';
import type {
  CreateAddressCommandDto,
  DataServiceWalletAddressesApi,
  PatchAddressCommandDto,
} from './data-service-wallet-addresses-api';
import { AddressDto, AddressTypeDto } from './data-service-dapps-api';
import { DialectWalletAdapterEd25519TokenSigner } from '../../auth/signers/ed25519-token-signer';

describe('Data service wallet addresses api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let wallet: DialectWalletAdapterWrapper;
  let api: DataServiceWalletAddressesApi;

  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    api = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(new DialectWalletAdapterEd25519TokenSigner(wallet)),
    ).walletAddresses;
  });

  test('can create wallet address', async () => {
    // when
    const command: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: wallet.publicKey.toBase58(),
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
        publicKey: wallet.publicKey.toBase58(),
      },
    };
    expect(created).toMatchObject(addressDtoExpected);
  });

  test('can get wallet address by id after creating', async () => {
    // given
    const command: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: wallet.publicKey.toBase58(),
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
        publicKey: wallet.publicKey.toBase58(),
      },
    };
    expect(found).toMatchObject(addressDtoExpected);
  });

  test('can find wallet addresses after creating', async () => {
    // given
    const command1: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: wallet.publicKey.toBase58(),
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
        publicKey: wallet.publicKey.toBase58(),
      },
    };
    const addressDto2Expected: AddressDto = {
      id: expect.any(String),
      type: command2.type,
      value: command2.value,
      verified: false,
      wallet: {
        id: expect.any(String),
        publicKey: wallet.publicKey.toBase58(),
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
        publicKey: wallet.publicKey.toBase58(),
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
      value: wallet.publicKey.toBase58(),
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
        publicKey: wallet.publicKey.toBase58(),
      },
    };
    expect(verifiedAddressDto).toMatchObject(addressDtoExpected);
  });

  test('can resend verification code for wallet address', async () => {
    // given
    const createCommand: CreateAddressCommandDto = {
      type: AddressTypeDto.Wallet,
      value: wallet.publicKey.toBase58(),
    };
    const createdAddressDto = await api.create(createCommand);
    // when
    await expect(
      api.resendVerificationCode(createdAddressDto.id),
    ).resolves.toBeTruthy();
  });
});
