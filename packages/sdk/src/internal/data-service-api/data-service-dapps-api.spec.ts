import type {
  CreateAddressCommandV0,
  DappAddressDtoV0,
  DataServiceWalletsApiV0,
} from './data-service-wallets-api.v0';
import { TokenProvider } from '../../auth/token-provider';
import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../../wallet-adapter/node-dialect-wallet-adapter';
import { Keypair } from '@solana/web3.js';
import { DataServiceApi } from './data-service-api';
import type { DataServiceDappsApi } from './data-service-dapps-api';
import { DialectWalletAdapterEd25519TokenSigner } from '../../auth/signers/ed25519-token-signer';
import type { CreateDappCommand } from '../../dapp/dapp.interface';
import type { DappDto } from './data-service-dapps-api';

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
    const command: CreateDappCommand = {
      name: 'Test dapp',
      description: 'Test description',
      avatarUrl: 'https://www.dialect.to/favicon-32x32.png',
    };
    const created = await dappsApi.create(command);
    const addresses = await dappsApi.findAllDappAddresses();
    // then
    const dappDtoExpected: DappDto = {
      id: expect.any(String),
      publicKey: dappWallet.publicKey.toBase58(),
      name: command.name,
      description: command.description,
      avatarUrl: command.avatarUrl,
      verified: false,
      telegramBotUserName: expect.any(String),
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
    };
    await expect(dappsApi.find()).rejects.toBeTruthy();
    await dappsApi.create(command);
    // when
    const found = await dappsApi.find();
    // then
    const dappDtoExpected: DappDto = {
      id: expect.any(String),
      publicKey: dappWallet.publicKey.toBase58(),
      name: command.name,
      description: command.description,
      avatarUrl: command.avatarUrl,
      telegramBotUserName: expect.any(String),
      verified: false,
    };
    expect(found).toMatchObject(dappDtoExpected);
  });

  test('can find all dapps', async () => {
    // given
    await expect(dappsApi.find()).rejects.toBeTruthy();
    const created = await dappsApi.create({
      name: 'Test dapp',
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
    });
    // when / then
    await expect(
      dappsApi.unicast({
        title: 'test-title',
        message: 'test',
        recipientPublicKey: Keypair.generate().publicKey.toBase58(),
      }),
    ).resolves.toBeTruthy();
  });

  test('can multicast notification', async () => {
    // given
    await dappsApi.create({
      name: 'Test dapp',
    });
    // when / then
    await expect(
      dappsApi.multicast({
        title: 'test-title',
        message: 'test',
        recipientPublicKeys: [
          Keypair.generate().publicKey.toBase58(),
          Keypair.generate().publicKey.toBase58(),
        ],
      }),
    ).resolves.toBeTruthy();
  });

  test('can broadcast notification', async () => {
    // given
    await dappsApi.create({
      name: 'Test dapp',
    });
    // when / then
    await expect(
      dappsApi.broadcast({
        title: 'test-title',
        message: 'test',
      }),
    ).resolves.toBeTruthy();
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
        name: 'Test dapp',
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
        name: 'Test dapp',
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
        name: 'Test dapp',
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
