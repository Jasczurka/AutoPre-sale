import Cookies from 'js-cookie'

import { isNil } from 'es-toolkit'

import type { ICookieAttributes, ICookieService, ICookieValueMap } from './ICookieService'

import { EMPTY_STRING, ZERO } from '../const.ts'

import { ECookieKey } from './ECookieKey'

class CookieService implements ICookieService {
    public get<TKey extends keyof ICookieValueMap>(key: TKey) {
        const value = Cookies.get(key)

        if (isNil(value) || value === EMPTY_STRING)
            throw new Error(`There is no value for the key Cookies: ${String(key)}`)

        return JSON.parse(value) as ICookieValueMap[TKey]
    }

    public set<TKey extends keyof ICookieValueMap>(
        key: TKey,
        payload: ICookieValueMap[TKey],
        options?: ICookieAttributes,
    ): void {
        const _options: ICookieAttributes = { ...options }

        if (_options.expires !== undefined && !(_options.expires instanceof Date)) {
            _options.expires = new Date(_options.expires)
        }

        Cookies.set(key, JSON.stringify(payload), _options)
    }

    public remove<TKey extends keyof ICookieValueMap>(
        key: TKey,
        options?: ICookieAttributes,
    ): void {
        Cookies.remove(key, { maxAge: ZERO, ...options })
    }

    public clearItem<TKey extends keyof ICookieValueMap>(key: TKey) {
        Cookies.set(key, EMPTY_STRING)
    }

    public clear() {
        Object.values(ECookieKey).forEach((key) => {
            Cookies.set(key, EMPTY_STRING)
        })
    }
}

export { CookieService }
