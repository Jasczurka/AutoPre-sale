import type {IHttpService} from "@shared/api/http/IHttpService.ts";
import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse, HttpStatusCode,
    type InternalAxiosRequestConfig
} from "axios";
import type {IBodyPayload, IParamsPayload} from "@shared/api/http/IPayload.ts";
import type {ICookieService} from "@shared/services/cookie/ICookieService.ts";
import type {IJwtService} from "@shared/services/jwt/IJwtService.ts";
import {CookieService} from "@shared/services/cookie/CookieService.ts";
import {ECookieKey} from "@shared/services/cookie/ECookieKey.ts";
import {JwtService} from "@shared/services/jwt/JwtService.ts";


class HttpService implements IHttpService {
    protected readonly _instance: AxiosInstance
    private readonly _cookieService: ICookieService
    private readonly _jwtService: IJwtService
    private _isRefreshing = false
    private _refreshQueue: ((token: string | null) => void)[] = []

    constructor(options: AxiosRequestConfig) {
        this._instance = axios.create(options)
        this._cookieService = new CookieService()
        this._jwtService = new JwtService()

        this._interceptRequest()
        this._interceptResponse()
    }

    public async delete<TResponse = unknown>(
        url: string,
        payload?: IBodyPayload,
    ): Promise<TResponse> {
        return this._instance.delete(url, {
            params: payload?.params,
            headers: payload?.headers,
            data: payload?.body,
        })
    }

    public async get<TResponse = unknown>(
        url: string,
        payload?: IParamsPayload,
    ): Promise<TResponse> {
        return this._instance.get(url, {
            params: payload?.params,
            headers: payload?.headers,
        })
    }

    public async patch<TResponse = unknown>(
        url: string,
        payload?: IBodyPayload,
    ): Promise<TResponse> {
        return this._instance.patch(url, payload?.body, {
            params: payload?.params,
            headers: payload?.headers,
        })
    }

    public async post<TResponse = unknown>(
        url: string,
        payload?: IBodyPayload,
    ): Promise<TResponse> {
        return this._instance.post(url, payload?.body, {
            params: payload?.params,
            headers: payload?.headers,
        })
    }

    public async put<TResponse = unknown>(
        url: string,
        payload?: IBodyPayload,
    ): Promise<TResponse> {
        return this._instance.put(url, payload?.body, {
            params: payload?.params,
            headers: payload?.headers,
        })
    }

    public setHeader(key: string, value: string | number | boolean): void {
        this._instance.defaults.headers.common[key] = value
    }

    public setHeaders(headers: Record<string, string | number | boolean>): void {
        this._instance.defaults.headers.common = {
            ...this._instance.defaults.headers.common,
            ...headers,
        }
    }

    private _interceptRequest(): void {
        this._instance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                try {
                    if (config.url?.includes("/auth/refresh")) return config

                    let accessToken: string | null;
                    try {
                        accessToken = this._cookieService.get(ECookieKey.ACCESS_TOKEN)
                    } catch {
                        accessToken = null
                    }

                    if (accessToken && this._jwtService.isTokenExpired(accessToken)) {
                        const newAccessToken = await this._refreshToken()
                        if (newAccessToken) {
                            config.headers.Authorization = `Bearer ${newAccessToken}`
                        }
                    } else if (accessToken) {
                        config.headers.Authorization = `Bearer ${accessToken}`
                    }

                    return config
                } catch {
                    return config
                }
            },
            (error) => Promise.reject(error),
        )
    }

    private _interceptResponse(): void {
        this._instance.interceptors.response.use(
            (response: AxiosResponse) => response.data,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig

                if (
                    originalRequest &&
                    error.response?.status === HttpStatusCode.Unauthorized &&
                    originalRequest.headers?.isSecondRequest !== "true"
                ) {
                    try {
                        const newAccessToken = await this._refreshToken()
                        if (!newAccessToken) throw new Error("Refresh failed")

                        originalRequest.headers?.set?.('Authorization', `Bearer ${newAccessToken}`)
                        originalRequest.headers?.set?.('isSecondRequest', `true`)

                        return this._instance.request(originalRequest)
                    } catch {
                        return Promise.reject({ statusCode: HttpStatusCode.Unauthorized })
                    }
                }

                return Promise.reject({
                    statusCode: error.response?.status ?? HttpStatusCode.BadRequest,
                    data: error.response?.data,
                })
            },
        )
    }

    // 🔁 Обновление accessToken по refreshToken
    private async _refreshToken(): Promise<string | null> {
        if (this._isRefreshing) {
            return new Promise((resolve) => {
                this._refreshQueue.push(resolve)
            })
        }

        this._isRefreshing = true

        try {
            const refreshToken = this._cookieService.get(ECookieKey.REFRESH_TOKEN)
            if (!refreshToken) throw new Error("No refresh token")

            const response = await axios.post(`${this._instance.defaults.baseURL}/auth/refresh`, {
                refreshToken,
            })

            const newAccessToken = response.data.accessToken
            if (newAccessToken) {
                this._cookieService.set(ECookieKey.ACCESS_TOKEN, newAccessToken)
                this._refreshQueue.forEach((resolve) => resolve(newAccessToken))
                this._refreshQueue = []
            }

            return newAccessToken
        } catch (error) {
            console.error('Refresh token failed:', error)
            this._refreshQueue.forEach((resolve) => resolve(null))
            this._refreshQueue = []
            return null
        } finally {
            this._isRefreshing = false
        }
    }
}

export { HttpService }
