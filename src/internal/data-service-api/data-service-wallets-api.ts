import type { TokenProvider } from '@auth/internal/token-provider';
import axios from 'axios';
import { withReThrowingDataServiceError } from '@data-service-api/data-service-api';

export interface CreateAddressCommandV0 {
  type: string;
  value: string;
  enabled: boolean;
}

export interface DeleteAddressCommandV0 {
  id: string;
}

export interface DappAddressDtoV0 {
  id: string;
  type: string;
  verified: boolean;
  addressId: string;
  dapp: string; // e.g. 'D1ALECTfeCZt9bAbPWtJk7ntv24vDYGPmyS7swp7DY5h'
  enabled: boolean;
}

export interface DataServiceWalletsApiV0 {
  createAddress(command: CreateAddressCommandV0): Promise<DappAddressDtoV0>;
  deleteAddress(command: DeleteAddressCommandV0): Promise<void>;
}

export class DataServiceWalletsApiClientV0 implements DataServiceWalletsApiV0 {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  createAddress(command: CreateAddressCommandV0): Promise<DappAddressDtoV0> {
    throw new Error('Method not implemented.');
  }
  deleteAddress(command: DeleteAddressCommandV0): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // async create(command: CreateDappCommandDto): Promise<DappDto> {
  //   const token = await this.tokenProvider.get();
  //
  //   return withReThrowingDataServiceError(
  //     axios
  //       .post<DappDto>(`${this.baseUrl}/v0/dapps`, command, {
  //         headers: { Authorization: `Bearer ${token.rawValue}` },
  //       })
  //       .then((it) => it.data),
  //   );
  // }
  //
  // async findAllDappAddresses(): Promise<DappAddressDto[]> {
  //   const token = await this.tokenProvider.get();
  //   return withReThrowingDataServiceError(
  //     axios
  //       .get<DappAddressDto[]>(
  //         `${this.baseUrl}/v0/dapps/${token.body.sub}/dappAddresses`,
  //         {
  //           headers: { Authorization: `Bearer ${token.rawValue}` },
  //         },
  //       )
  //       .then((it) => it.data),
  //   );
  // }
}
