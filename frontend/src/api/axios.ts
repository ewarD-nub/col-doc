import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import axiosStatic, {
  type AxiosInstance,
  type AxiosError,
  type CreateAxiosDefaults,
  type InternalAxiosRequestConfig,
} from 'axios';
import { logger } from '../module/logger';

const defaultAxiosConfig: CreateAxiosDefaults = {
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
};

// TODO: read the persisted access token and attach it as a Bearer header.
const injectAuthToken = (config: InternalAxiosRequestConfig) => config;

/**
 * Lazily builds a configured axios instance wrapped in an Observable so the
 * `HttpClient` base class can subscribe and swap in the client once it's ready.
 *
 * TODO: refresh the access token on 401 and retry the original request.
 */
export const axiosInstance = (): Observable<AxiosInstance> =>
  of(null).pipe(
    map(() => {
      const client = axiosStatic.create(defaultAxiosConfig);
      client.interceptors.request.use(injectAuthToken);
      client.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          logger.error('HTTP request failed', { error: error as unknown as Error });
          return Promise.reject(error);
        },
      );
      return client;
    }),
  );
