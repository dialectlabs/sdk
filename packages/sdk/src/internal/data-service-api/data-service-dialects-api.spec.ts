import { TokenProvider } from '../../auth/token-provider';
import type {
  CreateDialectCommand,
  DataServiceDialectsApi,
  DialectDto,
  SendMessageCommand,
} from './data-service-dialects-api';
import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { MemberScopeDto } from './data-service-dialects-api';
import { NodeDialectWalletAdapter } from '../../wallet-adapter/node-dialect-wallet-adapter';
import { Keypair } from '@solana/web3.js';
import { DataServiceApi } from './data-service-api';
import { DialectWalletAdapterEd25519TokenSigner } from '../../auth/signers/ed25519-token-signer';

describe('Data service dialects api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  // TODO: cleanup created resources after tests
  let wallet1: DialectWalletAdapterWrapper;
  let wallet1Api: DataServiceDialectsApi;
  let wallet2: DialectWalletAdapterWrapper;
  let wallet2Api: DataServiceDialectsApi;

  beforeEach(() => {
    wallet1 = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    wallet2 = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    wallet1Api = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(new DialectWalletAdapterEd25519TokenSigner(wallet1)),
    ).threads;
    wallet2Api = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(new DialectWalletAdapterEd25519TokenSigner(wallet2)),
    ).threads;
  });

  test('can list all dialects', async () => {
    // when
    const dialects = await wallet1Api.findAll();
    // then
    expect(dialects).toMatchObject([]);
  });

  test('wallet-adapter cannot crate dialect not being a member ', async () => {
    await expect(
      wallet1Api.create({
        encrypted: false,
        members: [
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('wallet-adapter canon create dialect with less than 2 members', async () => {
    await expect(
      wallet1Api.create({
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('wallet-adapter cannot create dialect with duplicate member', async () => {
    await expect(
      wallet1Api.create({
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.WRITE, MemberScopeDto.ADMIN],
          },
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.WRITE, MemberScopeDto.ADMIN],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('wallet-adapter cannot create dialect when member public key is invalid', async () => {
    await expect(
      wallet1Api.create({
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.WRITE, MemberScopeDto.ADMIN],
          },
          {
            publicKey: 'invalid-public-key',
            scopes: [MemberScopeDto.WRITE, MemberScopeDto.ADMIN],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('wallet-adapter cannot create second dialect with same members', async () => {
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Keypair().publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    await expect(wallet1Api.create(createDialectCommand)).resolves.toBeTruthy();
    await expect(wallet1Api.create(createDialectCommand)).rejects.toBeTruthy();
  });

  test('wallet-adapter cannot create dialect not being an admin', async () => {
    await expect(
      wallet1Api.create({
        encrypted: false,
        members: [
          {
            publicKey: wallet1.publicKey.toBase58(),
            scopes: [MemberScopeDto.WRITE],
          },
          {
            publicKey: new Keypair().publicKey.toBase58(),
            scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('can create dialect', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);
    // when
    const command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Keypair().publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { dialect, publicKey } = await wallet1Api.create(command);
    // then
    expect(publicKey).not.toBeNull();
    const expectedDialect: Omit<DialectDto, 'lastMessageTimestamp'> = {
      messages: [],
      members: command.members.map((it) => ({
        ...it,
        lastReadMessageTimestamp: 0,
      })),
      encrypted: command.encrypted,
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
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: wallet2.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { publicKey } = await wallet1Api.create(command);
    await expect(wallet2Api.find(publicKey)).resolves.toBeTruthy();
    // when
    await wallet2Api.delete(publicKey);
    await expect(wallet2Api.find(publicKey)).rejects.toBeTruthy();
  });

  test('non admin cannot delete dialect', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: wallet2.publicKey.toBase58(),
          scopes: [MemberScopeDto.WRITE],
        },
      ],
    };
    const { publicKey } = await wallet1Api.create(command);
    await expect(wallet2Api.find(publicKey)).resolves.toBeTruthy();
    // when
    await expect(wallet2Api.delete(publicKey)).rejects.toBeTruthy();
  });

  test('can list all dialects after creating', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);
    const createDialect1Command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Keypair().publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const createDialect2Command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Keypair().publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    await Promise.all([
      wallet1Api.create(createDialect1Command),
      wallet1Api.create(createDialect2Command),
    ]);
    const dialectAccountDtos = await wallet1Api.findAll();
    // then
    expect(dialectAccountDtos.length).toBe(2);
    const dialectAccountDto1 = dialectAccountDtos[0]!;
    const dialectAccountDto2 = dialectAccountDtos[1]!;
    expect(dialectAccountDto1.publicKey).not.toBe(dialectAccountDto2.publicKey);
    const actualDialects = new Set(
      dialectAccountDtos.map((it) => ({
        ...it.dialect,
      })),
    );
    const expectedDialects: Set<DialectDto> = new Set([
      {
        messages: [],
        members: createDialect1Command.members.map((it) => ({
          ...it,
          lastReadMessageTimestamp: 0,
        })),
        encrypted: createDialect1Command.encrypted,
        nextMessageIdx: 0,
        lastMessageTimestamp: expect.any(Number),
      },
      {
        messages: [],
        members: createDialect2Command.members.map((it) => ({
          ...it,
          lastReadMessageTimestamp: 0,
        })),
        encrypted: createDialect2Command.encrypted,
        nextMessageIdx: 0,
        lastMessageTimestamp: expect.any(Number),
      },
    ]);
    expect(actualDialects).toMatchObject(expectedDialects);
  });

  test('can get dialect by address key after creating', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Keypair().publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    const { publicKey } = await wallet1Api.create(createDialectCommand);
    const dialectAccountDto = await wallet1Api.find(publicKey);
    // then
    expect(dialectAccountDto).not.toBeNull();
    const actualDialectPublicKey = dialectAccountDto?.publicKey!;
    const actualDialect = dialectAccountDto?.dialect!;
    expect(actualDialectPublicKey).toBe(publicKey);
    expect(actualDialect).toMatchObject({
      messages: [],
      members: createDialectCommand.members,
      encrypted: createDialectCommand.encrypted,
      nextMessageIdx: 0,
    });
  });

  test('can get dialect by member key after creating', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: wallet2.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    const { publicKey } = await wallet1Api.create(createDialectCommand);
    const dialectAccountDtos = await wallet1Api.findAll({
      memberPublicKey: wallet2.publicKey.toBase58(),
    });
    // then
    expect(dialectAccountDtos.length).toBe(1);
    const dialectAccountDto = dialectAccountDtos[0];
    expect(dialectAccountDto).not.toBeUndefined();
    const actualDialectPublicKey = dialectAccountDto?.publicKey!;
    const actualDialect = dialectAccountDto?.dialect!;
    expect(actualDialectPublicKey).toBe(publicKey);
    expect(actualDialect).toMatchObject({
      messages: [],
      members: createDialectCommand.members,
      encrypted: createDialectCommand.encrypted,
      nextMessageIdx: 0,
    });
  });

  test('can send message to dialect', async () => {
    // given
    const createDialectCommand: CreateDialectCommand = {
      encrypted: true,
      members: [
        {
          publicKey: wallet1.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: wallet2.publicKey.toBase58(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    const { publicKey } = await wallet1Api.create(createDialectCommand);
    const sendMessageCommand1: SendMessageCommand = {
      text: Array.from(new TextEncoder().encode('Hello world 💬')),
    };
    await wallet1Api.sendMessage(publicKey, sendMessageCommand1);
    const sendMessageCommand2: SendMessageCommand = {
      text: Array.from(new TextEncoder().encode('Hello')),
    };
    const dialectAccountDto = (await wallet2Api.sendMessage(
      publicKey,
      sendMessageCommand2,
    ))!;
    // then
    const actualDialectPublicKey = dialectAccountDto?.publicKey!;
    const actualDialect = dialectAccountDto?.dialect!;
    expect(actualDialectPublicKey).toBe(publicKey);

    const messages = new Set(
      actualDialect.messages.map((it) => ({
        text: it.text,
        owner: it.owner,
      })),
    );
    expect(messages).toMatchObject(
      new Set([
        {
          text: sendMessageCommand1.text,
          owner: wallet1.publicKey.toBase58(),
        },
        {
          text: sendMessageCommand2.text,
          owner: wallet2.publicKey.toBase58(),
        },
      ]),
    );
    console.log(dialectAccountDto);
  });
});
