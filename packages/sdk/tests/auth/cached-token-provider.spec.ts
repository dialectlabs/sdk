import * as MockDate from 'mockdate';
import type { Token } from '../../src';
import {
  CachedTokenProvider,
  DataServiceWalletsApiClientV1,
  DefaultTokenProvider,
  Ed25519AuthenticationFacadeFactory,
  Ed25519TokenSigner,
  generateEd25519Keypair,
  TokenStore,
} from '../../src';
import { Duration } from 'luxon';

jest.mock('./../../src/dialect-cloud-api/data-service-wallets-api.v1');

describe('Cached token provider test', () => {
  beforeEach(() => {});

  afterEach(() => {
    MockDate.reset();
  });

  test(`
    given 
      cached token provider decorator is used
      and no token previously cached
    when 
      token is requested multiple times concurrently
    then 
      all token requests are succeeded
      token is generated only once and cached
      delegate token provider is called only once`, async () => {
    // given
    const tokenValidityMinutes = 1;
    const { cachedTokenProvider, delegateTokenProviderSpy } =
      createTokenProvider(tokenValidityMinutes);
    MockDate.set(new Date('1970-01-01T00:00:00.000Z'));
    expect(delegateTokenProviderSpy).toBeCalledTimes(0);
    // when
    const cycles = 3;
    const concurrentGetsPerCycle = 100;
    const totalRequests = cycles * concurrentGetsPerCycle;
    const tokens = await getTokensConcurrently(
      cachedTokenProvider,
      cycles,
      concurrentGetsPerCycle,
    );
    // then
    expect(tokens).toHaveLength(totalRequests);
    expect(new Set(tokens.map((it) => it.rawValue)).size).toBe(1);
    expect(delegateTokenProviderSpy).toBeCalledTimes(1);
  });

  test(`
    given 
      cached token provider decorator is used
      there is a an expired cached token
    when 
      token is requested multiple times concurrently
    then 
      all token requests are succeeded
      new token is generated only once and cached
      delegate token provider is called only once`, async () => {
    // given
    const tokenValidityMinutes = 1;
    const { cachedTokenProvider, delegateTokenProviderSpy } =
      createTokenProvider(tokenValidityMinutes);
    MockDate.set(new Date('1970-01-01T00:00:00.000Z'));
    const tokenBeforeExpiration = await cachedTokenProvider.get();
    jest.clearAllMocks();
    expect(delegateTokenProviderSpy).toBeCalledTimes(0);
    MockDate.set(new Date('1970-01-01T01:00:00.000Z'));
    // when
    const cycles = 3;
    const concurrentGetsPerCycle = 100;
    const totalRequests = cycles * concurrentGetsPerCycle;
    const tokens = await getTokensConcurrently(
      cachedTokenProvider,
      cycles,
      concurrentGetsPerCycle,
    );
    // then
    expect(tokens).toHaveLength(totalRequests);
    expect(new Set(tokens.map((it) => it.rawValue)).size).toBe(1);
    expect(tokens[0]?.rawValue).not.toBe(tokenBeforeExpiration.rawValue);
    expect(delegateTokenProviderSpy).toBeCalledTimes(1);
  });

  test(`
    given 
      cached token provider decorator is used
      token is requested once
      there is a an expired cached token
    when 
      token is expired
      and token is requested again
    then 
      new token is generated`, async () => {
    // given
    const tokenValidityMinutes = 1;
    const { cachedTokenProvider } = createTokenProvider(tokenValidityMinutes);
    MockDate.set(new Date('1970-01-01T00:00:00.000Z'));
    const tokenBeforeExpiration = await cachedTokenProvider.get();
    MockDate.set(new Date('1970-01-01T01:00:00.000Z'));
    // when
    const tokenAfterExpiration = await cachedTokenProvider.get();
    // then
    expect(tokenAfterExpiration.rawValue).not.toBe(
      tokenBeforeExpiration.rawValue,
    );
  });

  function createTokenProvider(tokenValidityMinutes: number) {
    const keypair = generateEd25519Keypair();
    const signer = new Ed25519TokenSigner(keypair);
    const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
      signer,
    ).get();

    const defaultTokenProvider = new DefaultTokenProvider(
      Duration.fromObject({ minutes: tokenValidityMinutes }),
      authenticationFacade.tokenGenerator,
    );
    const cachedTokenProvider = new CachedTokenProvider(
      defaultTokenProvider,
      TokenStore.createInMemory(),
      true,
      authenticationFacade.authenticator.parser,
      authenticationFacade.authenticator.validator,
      authenticationFacade.subject(),
      new DataServiceWalletsApiClientV1('mock'),
    );

    const delegateTokenProviderSpy = jest.spyOn(defaultTokenProvider, 'get');
    return { cachedTokenProvider, delegateTokenProviderSpy };
  }

  async function getTokensConcurrently(
    cachedTokenProvider: CachedTokenProvider,
    cycles: number,
    concurrentGetsPerCycle: number,
  ) {
    const acc: Token[] = [];
    for (let i = 0; i < cycles; i++) {
      console.log(`Getting tokens concurrently, cycle ${i + 1}/${cycles}`);
      const tokens = await Promise.all(
        new Array(concurrentGetsPerCycle)
          .fill(0)
          .map(() => cachedTokenProvider.get()),
      );
      acc.push(...tokens);
    }
    return acc;
  }
});
