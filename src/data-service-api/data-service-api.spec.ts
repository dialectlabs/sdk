import { EmbeddedWalletAdapter } from '../index';
import type { DataServiceDialectsApi } from './data-service-api';
import {
  CreateDialectCommand,
  DataServiceApi,
  DialectDto,
  MemberScopeDto,
} from './data-service-api';
import { TokenProvider } from './token-provider';
import { Keypair } from '@solana/web3.js';

describe('Data service api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  describe('Dialects', () => {
    let api: DataServiceDialectsApi;
    let walletAdapter: EmbeddedWalletAdapter;

    beforeEach(() => {
      walletAdapter = EmbeddedWalletAdapter.create();
      const tokenProvider = TokenProvider.create(walletAdapter);
      api = DataServiceApi.create(baseUrl, tokenProvider).dialects;
    });

    test('can list all dialects', async () => {
      // when
      const dialects = await api.list();
      // then
      expect(dialects).toMatchObject([]);
    });

    test('wallet cannot crate dialect not being a member ', async () => {
      await expect(
        api.create({
          encrypted: false,
          members: [
            {
              publicKey: new Keypair().publicKey.toBase58(),
              scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
            },
            {
              publicKey: new Keypair().publicKey.toBase58(),
              scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
            },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    test('wallet canon create dialect with less than 2 members', async () => {
      await expect(
        api.create({
          encrypted: false,
          members: [
            {
              publicKey: walletAdapter.publicKey.toBase58(),
              scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
            },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    test('wallet cannot create dialect with more than 2 members', async () => {
      await expect(
        api.create({
          encrypted: false,
          members: [
            {
              publicKey: walletAdapter.publicKey.toBase58(),
              scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
            },
            {
              publicKey: new Keypair().publicKey.toBase58(),
              scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
            },
            {
              publicKey: new Keypair().publicKey.toBase58(),
              scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
            },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    test('wallet cannot create dialect with duplicate member', async () => {
      await expect(
        api.create({
          encrypted: false,
          members: [
            {
              publicKey: walletAdapter.publicKey.toBase58(),
              scopes: [MemberScopeDto.Write, MemberScopeDto.Admin],
            },
            {
              publicKey: walletAdapter.publicKey.toBase58(),
              scopes: [MemberScopeDto.Write, MemberScopeDto.Admin],
            },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    test('wallet cannot create dialect when member public key is invalid', async () => {
      await expect(
        api.create({
          encrypted: false,
          members: [
            {
              publicKey: walletAdapter.publicKey.toBase58(),
              scopes: [MemberScopeDto.Write, MemberScopeDto.Admin],
            },
            {
              publicKey: 'invalid-public-key',
              scopes: [MemberScopeDto.Write, MemberScopeDto.Admin],
            },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    test('wallet cannot create second dialect with same members', async () => {
      const createDialectCommand: CreateDialectCommand = {
        encrypted: false,
        members: [
          {
            publicKey: walletAdapter.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
        ],
      };
      await expect(api.create(createDialectCommand)).resolves.toBeTruthy();
      await expect(api.create(createDialectCommand)).rejects.toBeTruthy();
    });

    test('wallet cannot create dialect not being an admin', async () => {
      await expect(
        api.create({
          encrypted: false,
          members: [
            {
              publicKey: walletAdapter.publicKey.toBase58(),
              scopes: [MemberScopeDto.Write],
            },
            {
              publicKey: new Keypair().publicKey.toBase58(),
              scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
            },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    test('can create dialect', async () => {
      // given
      const before = await api.list();
      expect(before).toMatchObject([]);
      // when
      const command: CreateDialectCommand = {
        encrypted: false,
        members: [
          {
            publicKey: walletAdapter.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
        ],
      };
      const { dialect, publicKey } = await api.create(command);
      // then
      expect(publicKey).not.toBeNull();
      const expectedDialect: DialectDto = {
        messages: [],
        members: command.members,
        encrypted: command.encrypted,
        lastMessageTimestamp: 0,
        nextMessageIdx: 0,
      };
      expect(dialect).toMatchObject(expectedDialect);
    });
  });
});
