interface IHeadersPayload {
    headers?: Record<string, string | number | boolean>
}

interface IParamsPayload extends IHeadersPayload {
    params?: Record<string, string | number | boolean>
}

interface IBodyPayload extends IParamsPayload {
    body?: unknown,
    responseType?: string,
}

export type { IParamsPayload, IBodyPayload }
