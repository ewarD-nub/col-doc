import axiosStatic, { type AxiosInstance, type AxiosRequestConfig }  from 'axios';
import { Observable } from 'rxjs';
import { logger } from "../module/logger"

type AxiosInstanceProvider = () => Observable<AxiosInstance>;

interface StreamConfig {
  headers?: Record<string, string>;
  onChunkReceived?: (chunk: string) => void;
  onStreamingComplete?: () => void;
  onError?: (error: unknown) => void;
}

abstract class HttpClient {
  private _api: AxiosInstance;

  protected api = () => this._api;

  /**
   * this base url is used to generate download url
   * for project files.
   * these download urls will be set as href for anchor tags.
   */
  // protected API_BASE = `${API_HOST}/${API_NAMESPACE}/${API_VERSION}`;
  protected API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

  public constructor(provider?: AxiosInstanceProvider) { 
    this._api = axiosStatic.create({
      baseURL: this.API_BASE,
    });
    provider?.().subscribe((client) => {
      this._api = client;
    });
  }

  public get = <T, R = T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> => {
    return this.api()
      .get(url, config)
      .then((x) => x.data);
  }
  public post = <T, B, R = T>(
    url: string,
    payload?: B,
    config?: AxiosRequestConfig,
  ): Promise<R> =>
    this.api()
      .post(url, payload, config)
      .then((x) => x.data);

  public put = <T, B, R = T>(
    url: string,
    payload?: B,
    config?: AxiosRequestConfig,
  ): Promise<R> =>
    this.api()
      .put(url, payload, config)
      .then((x) => x.data);
    
  public patch = <T, B, R = T>(
    url: string,
    payload?: B,
    config?: AxiosRequestConfig,
  ): Promise<R> =>
    this.api()
      .post(url, payload, config)
      .then((x) => x.data);

  public delete = <T, R = T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> =>
    this.api()
      .delete(url, config)
      .then((x) => x.data);

  public getStream = async (url: string, config?: StreamConfig) => {
    try {
      const responseForReturn = await fetch(url, {
        method: 'GET',
        headers: config?.headers ?? {},
      });

      const response = responseForReturn.clone();

      if (!response.body) {
        throw new Error('No response body');
      }
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Final call to onStreamChunk to tell caller streaming
          if (config?.onStreamingComplete) {
            config?.onStreamingComplete();
          }
          break;
        }
        config?.onChunkReceived?.(new TextDecoder().decode(value));
      }

      return responseForReturn;
    } catch (e) {
      logger.error('Error when fetching with streaming', { error: e as Error });
      config?.onError?.(e);

      return undefined;
    }
  }
}

export { HttpClient };