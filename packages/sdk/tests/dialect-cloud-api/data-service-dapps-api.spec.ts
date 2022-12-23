import type {
  CreateAddressCommandV0,
  DappAddressDtoV0,
  DataServiceWalletsApiV0,
} from '../../src/dialect-cloud-api/data-service-wallets-api.v0';
import type { AccountAddress, DataServiceWalletsApiV1 } from '../../src';
import {
  DataServiceApiFactory,
  DataServiceWalletsApiClientV1,
  Ed25519AuthenticationFacadeFactory,
  Ed25519PublicKey,
  Ed25519TokenSigner,
  generateEd25519Keypair,
  TokenProvider,
} from '../../src';
import type {
  DappDto,
  DataServiceDappsApi,
} from '../../src/dialect-cloud-api/data-service-dapps-api';
import type { CreateDappCommand } from 'dapp/dapp.interface';
import { BlockchainType } from 'dapp/dapp.interface';

describe('Data service dapps api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let dappsApi: DataServiceDappsApi;
  let dappAccountAddress: AccountAddress;

  beforeEach(() => {
    const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    dappAccountAddress = authenticationFacade.subject();
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(baseUrl);
    dappsApi = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(authenticationFacade, dataServiceWalletsApiV1),
    ).dapps;
  });

  test('can create dapp and find all dappAddresses', async () => {
    // when
    const command: CreateDappCommand = {
      name: 'Test dapp',
      description: 'Test description',
      avatarUrl: 'https://www.dialect.to/favicon-32x32.png',
      blockchainType: BlockchainType.SOLANA,
    };
    const created = await dappsApi.create(command);
    const addresses = await dappsApi.findAllDappAddresses();
    // then
    const dappDtoExpected: DappDto = {
      id: expect.any(String),
      publicKey: dappAccountAddress.toString(),
      name: command.name,
      description: command.description,
      avatarUrl: command.avatarUrl,
      verified: false,
      telegramBotUserName: expect.any(String),
      blockchainType: BlockchainType.SOLANA,
    };
    expect(created).toMatchObject(dappDtoExpected);
    expect(addresses).toMatchObject([]);
  });

  test('can find dapp', async () => {
    // given
    const command: CreateDappCommand = {
      name: 'Test dapp',
      description: 'Test description',
      avatarUrl: 'https://www.dialect.to/favicon-32x32.png',
      blockchainType: BlockchainType.SOLANA,
    };
    await expect(dappsApi.find()).rejects.toBeTruthy();
    await dappsApi.create(command);
    // when
    const found = await dappsApi.find();
    // then
    const dappDtoExpected: DappDto = {
      id: expect.any(String),
      publicKey: dappAccountAddress.toString(),
      name: command.name,
      description: command.description,
      avatarUrl: command.avatarUrl,
      telegramBotUserName: expect.any(String),
      verified: false,
      blockchainType: BlockchainType.SOLANA,
    };
    expect(found).toMatchObject(dappDtoExpected);
  });

  test('can find all dapps', async () => {
    // given
    await expect(dappsApi.find()).rejects.toBeTruthy();
    const created = await dappsApi.create({
      name: 'Test dapp',
      blockchainType: BlockchainType.SOLANA,
    });
    // when
    const found = await dappsApi.findAll({
      verified: false,
    });
    // then
    expect(found).toMatchObject(expect.arrayContaining([created]));
    // when
    const foundWithFilter = await dappsApi.findAll({
      verified: true,
    });
    // then
    expect(foundWithFilter).toMatchObject(
      expect.not.arrayContaining([created]),
    );
  });

  test('can unicast notification', async () => {
    // given
    await dappsApi.create({
      name: 'Test dapp',
      blockchainType: BlockchainType.SOLANA,
    });
    // when / then
    await expect(
      dappsApi.unicast({
        title: 'test-title',
        message: 'test',
        recipientPublicKey: new Ed25519PublicKey(
          generateEd25519Keypair().publicKey,
        ).toString(),
      }),
    ).resolves.toBeTruthy();
  });

  test('can multicast notification', async () => {
    // given
    await dappsApi.create({
      name: 'Test dapp',
      blockchainType: BlockchainType.SOLANA,
    });
    // when / then
    await expect(
      dappsApi.multicast({
        title: 'test-title',
        message: 'test',
        recipientPublicKeys: [
          new Ed25519PublicKey(generateEd25519Keypair().publicKey).toString(),
          new Ed25519PublicKey(generateEd25519Keypair().publicKey).toString(),
        ],
      }),
    ).resolves.toBeTruthy();
  });

  test('can broadcast notification', async () => {
    // given
    await dappsApi.create({
      name: 'Test dapp',
      blockchainType: BlockchainType.SOLANA,
    });
    // when / then
    await expect(
      dappsApi.broadcast({
        title: 'test-title',
        message: 'test',
      }),
    ).resolves.toBeTruthy();
  });

  describe('Wallet api v1', () => {
    let walletAccountAddress: AccountAddress;
    let walletsV1: DataServiceWalletsApiV1;

    beforeEach(() => {
      const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
        new Ed25519TokenSigner(),
      ).get();
      walletAccountAddress = authenticationFacade.subject();
      const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
        baseUrl,
      );
      const dataServiceApi = DataServiceApiFactory.create(
        baseUrl,
        TokenProvider.create(authenticationFacade, dataServiceWalletsApiV1),
      );
    });
  });

  describe('Wallet dapp addresses v0', () => {
    let walletAccountAddress: AccountAddress;
    let wallets: DataServiceWalletsApiV0;
    let dapps: DataServiceDappsApi;

    beforeEach(() => {
      const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
        new Ed25519TokenSigner(),
      ).get();
      walletAccountAddress = authenticationFacade.subject();
      const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
        baseUrl,
      );
      const dataServiceApi = DataServiceApiFactory.create(
        baseUrl,
        TokenProvider.create(authenticationFacade, dataServiceWalletsApiV1),
      );
      wallets = dataServiceApi.walletsV0;
      dapps = dataServiceApi.dapps;
    });

    test('can create dapp address', async () => {
      // given
      const dapp = await dapps.create({
        name: 'Test dapp',
        blockchainType: BlockchainType.SOLANA,
      });
      // when
      const createDappAddressCommand: CreateAddressCommandV0 = {
        type: 'wallet',
        enabled: true,
        value: walletAccountAddress.toString(),
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
        value: walletAccountAddress.toString(),
      };
      expect(dappAddressDtoV0).toMatchObject(expected);
    });

    test('can find dapp address', async () => {
      // given
      const dapp = await dapps.create({
        name: 'Test dapp',
        blockchainType: BlockchainType.SOLANA,
      });
      const createDappAddressCommand: CreateAddressCommandV0 = {
        type: 'wallet',
        enabled: true,
        value: walletAccountAddress.toString(),
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
        name: 'Test dapp',
        blockchainType: BlockchainType.SOLANA,
      });
      const createDappAddressCommand: CreateAddressCommandV0 = {
        type: 'wallet',
        enabled: true,
        value: walletAccountAddress.toString(),
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
