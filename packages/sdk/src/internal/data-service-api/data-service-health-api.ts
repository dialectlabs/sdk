import { withReThrowingDataServiceError } from '@data-service-api/data-service-api';
import axios from 'axios';

export declare type HealthCheckStatusDto = 'error' | 'ok' | 'shutting_down';
export declare type HealthIndicatorStatusDto = 'up' | 'down';
export declare type HealthIndicatorResultDto = {
  [key: string]: {
    status: HealthIndicatorStatusDto;
    [optionalKeys: string]: any;
  };
};

export interface HealthCheckResultDto {
  readonly status: HealthCheckStatusDto;
  readonly info?: HealthIndicatorResultDto;
  readonly error?: HealthIndicatorResultDto;
  readonly details: HealthIndicatorResultDto;
}

export interface DataServiceHealthApi {
  healthCheck(): Promise<HealthCheckResultDto>;
}

export class DataServiceHealthApiClient implements DataServiceHealthApi {
  constructor(private readonly baseUrl: string) {}

  healthCheck(): Promise<HealthCheckResultDto> {
    return withReThrowingDataServiceError(
      axios
        .get<HealthCheckResultDto>(`${this.baseUrl}/api/v1/health`)
        .then((it) => it.data),
    );
  }
}
