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
    let wallet1: EmbeddedWalletAdapter;
    let wallet1Api: DataServiceDialectsApi;
    let wallet2: EmbeddedWalletAdapter;
    let wallet2Api: DataServiceDialectsApi;

    beforeEach(() => {
      wallet1 = EmbeddedWalletAdapter.create();
      wallet2 = EmbeddedWalletAdapter.create();
      wallet1Api = DataServiceApi.create(
        baseUrl,
        TokenProvider.create(wallet1),
      ).dialects;
      wallet2Api = DataServiceApi.create(
        baseUrl,
        TokenProvider.create(wallet2),
      ).dialects;
    });

    test('can list all dialects', async () => {
      // when
      const dialects = await wallet1Api.list();
      // then
      expect(dialects).toMatchObject([]);
    });

    test('wallet cannot crate dialect not being a member ', async () => {
      await expect(
        wallet1Api.create({
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
        wallet1Api.create({
          encrypted: false,
          members: [
            {
              publicKey: wallet1.publicKey.toBase58(),
              scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
            },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    test('wallet cannot create dialect with more than 2 members', async () => {
      await expect(
        wallet1Api.create({
          encrypted: false,
          members: [
            {
              publicKey: wallet1.publicKey.toBase58(),
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
        wallet1Api.create({
          encrypted: false,
          members: [
            {
              publicKey: wallet1.publicKey.toBase58(),
              scopes: [MemberScopeDto.Write, MemberScopeDto.Admin],
            },
            {
              publicKey: wallet1.publicKey.toBase58(),
              scopes: [MemberScopeDto.Write, MemberScopeDto.Admin],
            },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    test('wallet cannot create dialect when member public key is invalid', async () => {
      await expect(
        wallet1Api.create({
          encrypted: false,
          members: [
            {
              publicKey: wallet1.publicKey.toBase58(),
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
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
        ],
      };
      await expect(
        wallet1Api.create(createDialectCommand),
      ).resolves.toBeTruthy();
      await expect(
        wallet1Api.create(createDialectCommand),
      ).rejects.toBeTruthy();
    });

    test('wallet cannot create dialect not being an admin', async () => {
      await expect(
        wallet1Api.create({
          encrypted: false,
          members: [
            {
              publicKey: wallet1.publicKey.toBase58(),
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
      const before = await wallet1Api.list();
      expect(before).toMatchObject([]);
      // when
      const command: CreateDialectCommand = {
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
        ],
      };
      const { dialect, publicKey } = await wallet1Api.create(command);
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

    test('admin can delete dialect', async () => {
      // given
      const command: CreateDialectCommand = {
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: wallet2.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
        ],
      };
      const { publicKey } = await wallet1Api.create(command);
      await expect(wallet2Api.get(publicKey)).resolves.toBeTruthy();
      // when
      await wallet2Api.delete(publicKey);
      await expect(wallet2Api.get(publicKey)).rejects.toBeTruthy();
    });

    test('non admin cannot delete dialect', async () => {
      // given
      const command: CreateDialectCommand = {
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: wallet2.publicKey.toBase58(),
            scopes: [MemberScopeDto.Write],
          },
        ],
      };
      const { publicKey } = await wallet1Api.create(command);
      await expect(wallet2Api.get(publicKey)).resolves.toBeTruthy();
      // when
      await expect(wallet2Api.delete(publicKey)).rejects.toBeTruthy();
    });

    test('can list all dialects after creating', async () => {
      // given
      const before = await wallet1Api.list();
      expect(before).toMatchObject([]);
      const createDialect1Command: CreateDialectCommand = {
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
        ],
      };
      const createDialect2Command: CreateDialectCommand = {
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
        ],
      };
      // when
      await Promise.all([
        wallet1Api.create(createDialect1Command),
        wallet1Api.create(createDialect2Command),
      ]);
      const dialectAccountDtos = await wallet1Api.list();
      // then
      expect(dialectAccountDtos.length).toBe(2);
      const dialectAccountDto1 = dialectAccountDtos[0]!;
      const dialectAccountDto2 = dialectAccountDtos[1]!;
      expect(dialectAccountDto1.publicKey).not.toBe(
        dialectAccountDto2.publicKey,
      );
      const actualDialects = new Set(
        dialectAccountDtos.map((it) => it.dialect),
      );
      const expectedDialects: Set<DialectDto> = new Set([
        {
          messages: [],
          members: createDialect1Command.members,
          encrypted: createDialect1Command.encrypted,
          lastMessageTimestamp: 0,
          nextMessageIdx: 0,
        },
        {
          messages: [],
          members: createDialect2Command.members,
          encrypted: createDialect2Command.encrypted,
          lastMessageTimestamp: 0,
          nextMessageIdx: 0,
        },
      ]);
      expect(actualDialects).toMatchObject(expectedDialects);
    });

    test('can get dialect by key after creating', async () => {
      // given
      const before = await wallet1Api.list();
      expect(before).toMatchObject([]);
      const createDialectCommand: CreateDialectCommand = {
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.Admin, MemberScopeDto.Write],
          },
        ],
      };
      // when
      const { publicKey } = await wallet1Api.create(createDialectCommand);
      const dialectAccountDto = await wallet1Api.get(publicKey);
      // then
      expect(dialectAccountDto).not.toBeNull();
      const actualDialectPublicKey = dialectAccountDto?.publicKey!;
      const actualDialect = dialectAccountDto?.dialect!;
      expect(actualDialectPublicKey).toBe(publicKey);
      expect(actualDialect).toMatchObject({
        messages: [],
        members: createDialectCommand.members,
        encrypted: createDialectCommand.encrypted,
        lastMessageTimestamp: 0,
        nextMessageIdx: 0,
      });
    });
  });
});
