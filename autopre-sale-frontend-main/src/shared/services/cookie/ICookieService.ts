import type Cookies from 'js-cookie'
import type { ECookieKey } from './ECookieKey'
import type {TWO} from "../const.ts";

type ICookieAttributes = Parameters<typeof Cookies.set>[typeof TWO]

interface ICookieService {
    get: <TKey extends keyof ICookieValueMap>(
        key: TKey,
    ) => ICookieValueMap[TKey] | null

    set: <TKey extends keyof ICookieValueMap>(
        key: TKey,
        payload: ICookieValueMap[TKey],
        options?: ICookieAttributes,
    ) => void

    remove: <TKey extends keyof ICookieValueMap>(
        key: TKey,
        options?: ICookieAttributes,
    ) => void

    clearItem: <TKey extends keyof ICookieValueMap>(key: TKey) => void

    clear: () => void
}

interface ICookieValueMap {
    [ECookieKey.ACCESS_TOKEN]: string
    [ECookieKey.REFRESH_TOKEN]: string
}

export type { ICookieAttributes, ICookieService, ICookieValueMap }
