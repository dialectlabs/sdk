import { TokenProvider } from '../core/auth/token-provider';
import type {
  CreateDialectCommand,
  DataServiceDialectsApi,
  DialectDto,
  SendMessageCommand,
} from './data-service-dialects-api';
import { MemberScopeDto } from './data-service-dialects-api';
import { DataServiceApi } from './data-service-api';
import { TestEd25519AuthenticationFacadeFactory } from '../core/auth/ed25519/test-ed25519-authentication-facade-factory';
import type { AccountAddress } from '../core/auth/auth.interface';
import { TestEd25519TokenSigner } from '../core/auth/ed25519/test-ed25519-token-signer';
import { Ed25519PublicKey } from '../core/auth/ed25519/ed25519-public-key';
import { generateEd25519Keypair } from '../core/auth/ed25519/utils';

describe('Data service dialects api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  // TODO: cleanup created resources after tests
  let wallet1Address: AccountAddress;
  let wallet1Api: DataServiceDialectsApi;
  let wallet2Address: AccountAddress;
  let wallet2Api: DataServiceDialectsApi;

  beforeEach(() => {
    const wallet1AuthenticationFacade =
      new TestEd25519AuthenticationFacadeFactory(
        new TestEd25519TokenSigner(),
      ).get();
    wallet1Address = wallet1AuthenticationFacade.subject();
    wallet1Api = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(wallet1AuthenticationFacade),
    ).threads;
    const wallet2AuthenticationFacade =
      new TestEd25519AuthenticationFacadeFactory(
        new TestEd25519TokenSigner(),
      ).get();
    wallet2Address = wallet2AuthenticationFacade.subject();
    wallet2Api = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(wallet2AuthenticationFacade),
    ).threads;
  });

  test('can list all dialects', async () => {
    // when
    const dialects = await wallet1Api.findAll();
    // then
    expect(dialects).toMatchObject([]);
  });

  test('wallet-adapter cannot crate dialect not being a member ', async () => {
    const command1: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: new Ed25519PublicKey(
            generateEd25519Keypair().publicKey,
          ).toString(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Ed25519PublicKey(
            generateEd25519Keypair().publicKey,
          ).toString(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    await expect(wallet1Api.create(command1)).rejects.toBeTruthy();
  });

  test('wallet-adapter canon create dialect with less than 2 members', async () => {
    await expect(
      wallet1Api.create({
        encrypted: false,
        members: [
          {
            publicKey: wallet1Address,
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
            publicKey: wallet1Address,
            scopes: [MemberScopeDto.WRITE, MemberScopeDto.ADMIN],
          },
          {
            publicKey: wallet1Address,
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
            publicKey: wallet1Address,
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
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Ed25519PublicKey(
            generateEd25519Keypair().publicKey,
          ).toString(),
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
            publicKey: wallet1Address,
            scopes: [MemberScopeDto.WRITE],
          },
          {
            publicKey: new Ed25519PublicKey(
              generateEd25519Keypair().publicKey,
            ).toString(),
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
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Ed25519PublicKey(
            generateEd25519Keypair().publicKey,
          ).toString(),
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
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: wallet2Address,
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
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: wallet2Address,
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
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Ed25519PublicKey(
            generateEd25519Keypair().publicKey,
          ).toString(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const createDialect2Command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Ed25519PublicKey(
            generateEd25519Keypair().publicKey,
          ).toString(),
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
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: new Ed25519PublicKey(
            generateEd25519Keypair().publicKey,
          ).toString(),
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

  test('can limit the number of messages returned', async() => {
    // when
    const dialects = await wallet1Api.findAll({
      takeMessages: 1,
    });
    // then
    expect(dialects).toMatchObject([]);
  });

  test('can get dialect by member key after creating', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    const { publicKey } = await wallet1Api.create(createDialectCommand);
    const dialectAccountDtos = await wallet1Api.findAll({
      memberPublicKey: wallet2Address,
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
          publicKey: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          publicKey: wallet2Address,
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
          owner: wallet1Address,
        },
        {
          text: sendMessageCommand2.text,
          owner: wallet2Address,
        },
      ]),
    );
    console.log(dialectAccountDto);
  });
});
