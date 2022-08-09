import { Duration } from 'luxon';
import {
  NodeDialectWalletAdapter,
  DialectWalletAdapterWrapper,
  DialectWalletAdapterEd25519TokenSigner,
  Auth,
} from '../src';

import axios, { AxiosError } from 'axios';

const wallet = DialectWalletAdapterWrapper.create(
  NodeDialectWalletAdapter.create(),
);

(async () => {
  const token = await Auth.tokens.generate(
    new DialectWalletAdapterEd25519TokenSigner(wallet),
    Duration.fromObject({ minutes: 120 }),
  );

  console.log(token.body);

  const body = {
    messageId: '123', //unique id of message
    externalDappId: 'D1ALECTfeCZt9bAbPWtJk7ntv24vDYGPmyS7swp7DY5h', //use PK of dapp
    body: 'hey trying again',
    title: null, //you can leave this as null
    image: null, //you can leave this as null
    actionUrl: null, //you can leave this as null
    publicKeys: [
      'AC7YHa5qAm1EwLPG6Qn2reRPCzYEyUPZchQkAyRMYysf', //user's public keys
    ],
  };
  try {
    const result = await axios.post<void>(
      `https://dev-api.solcast.dev/v1/casts/external-cast`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token.rawValue}`,
        },
      },
    );
    console.log(result);
  } catch (e) {
    const err = e as AxiosError;
    console.error(err.request);
    console.error(err.message);
    console.error(err.code);
    console.error(err?.response?.data);
  }
})();
