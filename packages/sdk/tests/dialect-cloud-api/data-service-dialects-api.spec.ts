import { TokenProvider } from '../../src/auth/token-provider';
import type {
  CreateDialectCommand,
  DataServiceDialectsApi,
  DialectDto,
  SendMessageCommand,
} from '../../src/dialect-cloud-api/data-service-dialects-api';
import { MemberScopeDto } from '../../src/dialect-cloud-api/data-service-dialects-api';
import { Ed25519AuthenticationFacadeFactory } from '../../src/auth/ed25519/ed25519-authentication-facade-factory';
import type { AccountAddress } from '../../src/auth/auth.interface';
import { Ed25519TokenSigner } from '../../src/auth/ed25519/ed25519-token-signer';
import { Ed25519PublicKey } from '../../src/auth/ed25519/ed25519-public-key';
import { generateEd25519Keypair } from '../../src/auth/ed25519/utils';
import { DataServiceApiFactory } from '../../src/dialect-cloud-api/data-service-api-factory';
import { DataServiceWalletsApiClientV1 } from '../../src/dialect-cloud-api/data-service-wallets-api.v1';

function generatePublicKey() {
  return new Ed25519PublicKey(generateEd25519Keypair().publicKey).toString();
}

describe('Data service dialects api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  // TODO: cleanup created resources after tests
  let wallet1Address: AccountAddress;
  let wallet1Api: DataServiceDialectsApi;
  let wallet2Address: AccountAddress;
  let wallet2Api: DataServiceDialectsApi;

  beforeEach(() => {
    const wallet1AuthenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    wallet1Address = wallet1AuthenticationFacade.subject();
    const w1DataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    wallet1Api = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(wallet1AuthenticationFacade, w1DataServiceWalletsApiV1),
    ).threads;
    const wallet2AuthenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    wallet2Address = wallet2AuthenticationFacade.subject();
    const w2DataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    wallet2Api = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(wallet2AuthenticationFacade, w2DataServiceWalletsApiV1),
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
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
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
            address: wallet1Address,
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
            address: wallet1Address,
            scopes: [MemberScopeDto.WRITE, MemberScopeDto.ADMIN],
          },
          {
            address: wallet1Address,
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
            address: wallet1Address,
            scopes: [MemberScopeDto.WRITE, MemberScopeDto.ADMIN],
          },
          {
            address: 'invalid-public-key',
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
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
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
            address: wallet1Address,
            scopes: [MemberScopeDto.WRITE],
          },
          {
            address: generatePublicKey(),
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
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { dialect, id } = await wallet1Api.create(command);
    // then
    expect(id).not.toBeNull();
    const expectedDialect: Omit<DialectDto, 'updatedAt'> = {
      members: command.members.map((it) => ({
        ...it,
        lastReadMessageTimestamp: 0,
      })),
      encrypted: command.encrypted,
    };
    expect(dialect).toMatchObject(expectedDialect);
  });

  test('can create group dialect', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);
    // when
    const command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { dialect, id } = await wallet1Api.create(command);
    // then
    expect(id).not.toBeNull();
    const expectedDialect: Omit<DialectDto, 'updatedAt'> = {
      members: command.members.map((it) => ({
        ...it,
        lastReadMessageTimestamp: 0,
      })),
      encrypted: command.encrypted,
      groupName: id,
    };
    expect(dialect).toMatchObject(expectedDialect);
  });

  test('cannot create encrypted group dialect', async () => {
    const createDialectCommand: CreateDialectCommand = {
      encrypted: true,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    await expect(wallet1Api.create(createDialectCommand)).rejects.toBeTruthy();
  });

  test('cannot create second group dialect with same members', async () => {
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    await expect(wallet1Api.create(createDialectCommand)).resolves.toBeTruthy();
    await expect(wallet1Api.create(createDialectCommand)).rejects.toBeTruthy();
  });

  test('admin can patch dialect', async () => {
    // when
    const command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(command);
    const testGroupName = 'test group name';
    const expectedDialect: Omit<DialectDto, 'updatedAt'> = {
      members: command.members.map((it) => ({
        ...it,
        lastReadMessageTimestamp: 0,
      })),
      encrypted: command.encrypted,
      groupName: testGroupName,
    };

    const { dialect: patchedDialect } = await wallet1Api.patch(id, {
      groupName: testGroupName,
    });

    expect(patchedDialect).toMatchObject(expectedDialect);
  });

  test('not admin can not patch dialect', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.WRITE, MemberScopeDto.ADMIN],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(command);
    const testGroupName = 'test group name';

    await expect(wallet1Api.find(id)).resolves.toBeTruthy();
    // when
    await expect(
      wallet2Api.patch(id, {
        groupName: testGroupName,
      }),
    ).rejects.toBeTruthy();
  });

  test('can not patch dialect with empty group name', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(command);
    const testGroupName = '';
    await expect(wallet1Api.find(id)).resolves.toBeTruthy();
    // when
    await expect(
      wallet2Api.patch(id, {
        groupName: testGroupName,
      }),
    ).rejects.toBeTruthy();
  });

  test('admin can delete dialect', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(command);
    await expect(wallet2Api.find(id)).resolves.toBeTruthy();
    // when
    await wallet2Api.delete(id);
    await expect(wallet2Api.find(id)).rejects.toBeTruthy();
  });

  test('non admin cannot delete dialect', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(command);
    await expect(wallet2Api.find(id)).resolves.toBeTruthy();
    // when
    await expect(wallet2Api.delete(id)).rejects.toBeTruthy();
  });

  test('can list all dialects after creating', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);
    const createDialect1Command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const createDialect2Command: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
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
    expect(dialectAccountDto1.id).not.toBe(dialectAccountDto2.id);
    const actualDialects = new Set(
      dialectAccountDtos.map((it) => ({
        ...it.dialect,
      })),
    );
    const expectedDialects: Set<DialectDto> = new Set([
      {
        members: createDialect1Command.members.map((it) => ({
          ...it,
          lastReadMessageTimestamp: 0,
        })),
        encrypted: createDialect1Command.encrypted,
        updatedAt: expect.any(Number),
      },
      {
        members: createDialect2Command.members.map((it) => ({
          ...it,
          lastReadMessageTimestamp: 0,
        })),
        encrypted: createDialect2Command.encrypted,
        updatedAt: expect.any(Number),
      },
    ]);
    expect(actualDialects).toMatchObject(expectedDialects);
  });

  test('can get dialect by id after creating', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    const { id } = await wallet1Api.create(createDialectCommand);
    const dialectAccountDto = await wallet1Api.find(id);
    // then
    expect(dialectAccountDto).not.toBeNull();
    const actualDialectId = dialectAccountDto?.id!;
    const actualDialect = dialectAccountDto?.dialect!;
    expect(actualDialectId).toBe(id);
    expect(actualDialect).toMatchObject({
      members: createDialectCommand.members,
      encrypted: createDialectCommand.encrypted,
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
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    const { id } = await wallet1Api.create(createDialectCommand);
    const dialectAccountDto = await wallet1Api.findByMembers({
      memberAddresses: [wallet2Address],
    });
    // then
    expect(dialectAccountDto).not.toBeUndefined();
    const actualDialectId = dialectAccountDto?.id!;
    const actualDialect = dialectAccountDto?.dialect!;
    expect(actualDialectId).toBe(id);
    expect(actualDialect).toMatchObject({
      members: createDialectCommand.members,
      encrypted: createDialectCommand.encrypted,
    });
  });

  test('when two dialects with overlapping members exist, find only dialect with exactly given members', async () => {
    // given
    const before = await wallet1Api.findAll();
    expect(before).toMatchObject([]);

    const member3 = {
      address: generatePublicKey(),
      scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
    };
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    const { id } = await wallet1Api.create(createDialectCommand);

    const createGroupDialectCommand = {
      ...createDialectCommand,
      members: [...createDialectCommand.members, member3],
    };
    await wallet1Api.create(createGroupDialectCommand);
    const dialectAccountDto = await wallet1Api.findByMembers({
      memberAddresses: [wallet2Address],
    });
    // then
    expect(dialectAccountDto).not.toBeUndefined();
    const actualDialectId = dialectAccountDto?.id!;
    const actualDialect = dialectAccountDto?.dialect!;
    expect(actualDialectId).toBe(id);
    expect(actualDialect).toMatchObject({
      members: createDialectCommand.members,
      encrypted: createDialectCommand.encrypted,
    });
  });

  test('can add members to group dialect', async () => {
    const member3 = generatePublicKey();
    const member4 = generatePublicKey();
    const member5 = generatePublicKey();
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };

    const { id } = await wallet1Api.create(createDialectCommand);

    // when
    await wallet1Api.addMembers(id, {
      members: [
        {
          address: member4,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member5,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    });
    const dialectAccountDto = await wallet1Api.findByMembers({
      memberAddresses: [wallet2Address, member3, member4, member5],
    });
    // then
    expect(dialectAccountDto).not.toBeUndefined();
    const actualDialectId = dialectAccountDto?.id!;
    const actualDialect = dialectAccountDto?.dialect!;
    expect(actualDialectId).toBe(id);
    expect(actualDialect).toMatchObject({
      members: [
        ...createDialectCommand.members,
        {
          address: member4,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member5,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
      encrypted: createDialectCommand.encrypted,
    });
  });

  test('can remove member from group dialect', async () => {
    const member3 = generatePublicKey();
    const member4 = generatePublicKey();
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member4,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };

    const { id } = await wallet1Api.create(createDialectCommand);

    // when
    await wallet1Api.removeMember(id, member4);

    const dialectAccountDto = await wallet1Api.findByMembers({
      memberAddresses: [wallet2Address, member3],
    });
    // then
    expect(dialectAccountDto).not.toBeUndefined();
    const actualDialectId = dialectAccountDto?.id!;
    const actualDialect = dialectAccountDto?.dialect!;
    expect(actualDialectId).toBe(id);
    expect(actualDialect).toMatchObject({
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
      encrypted: createDialectCommand.encrypted,
    });
  });

  test('cannot add member to p2p dialect', async () => {
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(createDialectCommand);

    // when
    const member3 = generatePublicKey();
    await expect(
      wallet1Api.addMembers(id, {
        members: [
          {
            address: member3,
            scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('cannot add member if not admin', async () => {
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(createDialectCommand);

    await expect(
      wallet2Api.addMembers(id, {
        members: [
          {
            address: generatePublicKey(),
            scopes: [MemberScopeDto.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('cannot remove member if not admin', async () => {
    const createDialectCommand: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.WRITE],
        },
        {
          address: generatePublicKey(),
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(createDialectCommand);

    await expect(
      wallet2Api.addMembers(id, {
        members: [
          {
            address: generatePublicKey(),
            scopes: [MemberScopeDto.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('cannot add member to match existing group dialect', async () => {
    const member3 = generatePublicKey();
    const member4 = generatePublicKey();
    const createDialectCommand1: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member4,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    await wallet1Api.create(createDialectCommand1);
    const createDialectCommand2: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const dialect2 = await wallet1Api.create(createDialectCommand2);

    await expect(
      wallet1Api.addMembers(dialect2.id, {
        members: [
          {
            address: member4,
            scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
          },
        ],
      }),
    ).rejects.toBeTruthy();
  });

  test('cannot remove member to match existing group dialect', async () => {
    const member3 = generatePublicKey();
    const member4 = generatePublicKey();
    const createDialectCommand1: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member4,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const dialect1 = await wallet1Api.create(createDialectCommand1);

    const createDialectCommand2: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    await wallet1Api.create(createDialectCommand2);
    await expect(
      wallet1Api.removeMember(dialect1.id, member4),
    ).rejects.toBeTruthy();
  });

  test('cannot remove address which is not a member', async () => {
    const member3 = generatePublicKey();
    const member4 = generatePublicKey();
    const createDialectCommand1: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const dialect1 = await wallet1Api.create(createDialectCommand1);

    await expect(
      wallet1Api.removeMember(dialect1.id, member4),
    ).rejects.toBeTruthy();
  });

  test('cannot remove oneself', async () => {
    const member3 = generatePublicKey();

    const createDialectCommand1: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const dialect1 = await wallet1Api.create(createDialectCommand1);

    await expect(
      wallet1Api.removeMember(dialect1.id, wallet1Address),
    ).rejects.toBeTruthy();
  });

  test('cannot remove member to leave p2p dialect', async () => {
    const member3 = generatePublicKey();
    const createDialectCommand1: CreateDialectCommand = {
      encrypted: false,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: member3,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    const { id } = await wallet1Api.create(createDialectCommand1);

    await expect(wallet1Api.removeMember(id, member3)).rejects.toBeTruthy();
  });

  test('can send message to dialect', async () => {
    // given
    const createDialectCommand: CreateDialectCommand = {
      encrypted: true,
      members: [
        {
          address: wallet1Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
        {
          address: wallet2Address,
          scopes: [MemberScopeDto.ADMIN, MemberScopeDto.WRITE],
        },
      ],
    };
    // when
    const { id } = await wallet1Api.create(createDialectCommand);
    const sendMessageCommand1: SendMessageCommand = {
      text: Array.from(new TextEncoder().encode('Hello world 💬')),
    };
    await wallet1Api.sendMessage(id, sendMessageCommand1);
    const sendMessageCommand2: SendMessageCommand = {
      text: Array.from(new TextEncoder().encode('Hello')),
    };
    await wallet2Api.sendMessage(id, sendMessageCommand2);

    const { messages } = await wallet1Api.getMessages(id);

    // then
    const messagesSummary = new Set(
      messages.map((it) => ({
        text: it.text,
        owner: it.owner,
      })),
    );
    expect(messagesSummary).toMatchObject(
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
  });
});
