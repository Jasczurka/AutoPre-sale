import type {IBodyPayload, IParamsPayload} from "@shared/api/http/IPayload.ts";

interface IHttpService {
    setHeader: (key: string, value: string|number|boolean) => void;
    setHeaders: (headers: Record<string, string | number | boolean>) => void;

    get: <TResponse = unknown>(
        url: string,
        payload?: IParamsPayload
    ) => Promise<TResponse>;

    post: <TResponse = unknown>(
        url: string,
        payload?: IBodyPayload,
    ) => Promise<TResponse>

    put: <TResponse = unknown>(
        url: string,
        payload?: IBodyPayload,
    ) => Promise<TResponse>

    patch: <TResponse = unknown>(
        url: string,
        payload?: IBodyPayload,
    ) => Promise<TResponse>

    delete: <TResponse = unknown>(
        url: string,
        payload?: IBodyPayload,
    ) => Promise<TResponse>
}

export type { IHttpService };