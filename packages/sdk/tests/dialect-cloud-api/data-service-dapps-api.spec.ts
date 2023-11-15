import type {
  CreateAddressCommandV0,
  DappAddressDtoV0,
  DataServiceWalletsApiV0,
} from '../../src/dialect-cloud-api/data-service-wallets-api.v0';
import type {
  AccountAddress,
  CreateDappCommand,
  DataServiceWalletsApiV1,
} from '../../src';
import {
  BlockchainType,
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
});
