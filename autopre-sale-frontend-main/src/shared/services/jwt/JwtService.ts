import type { IJwtResponse, IJwtService } from './IJwtService'

import {
    EMPTY_STRING,
    MILLISECONDS_IN_SECOND,
    ONE,
    TWO,
    ZERO,
    SIXTEEN,
} from '../const'

class JwtService implements IJwtService {
    public verify<TPayload>(token: string): IJwtResponse<TPayload> {
        const radix = SIXTEEN
        const slice = -TWO

        const payload = token.split('.')[ONE]
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoder = window
            .atob(base64)
            .split(EMPTY_STRING)
            .map((c) => {
                return `%${`00${c.charCodeAt(ZERO).toString(radix)}`.slice(slice)}`
            })

        const jsonPayload = decodeURIComponent(decoder.join(EMPTY_STRING))

        return JSON.parse(jsonPayload) as IJwtResponse<TPayload>
    }

    public isTokenExpired(token: string): boolean {
        const decoded = this.verify(token)

        if (!decoded.exp) return true

        const currentTime = Math.floor(Date.now() / MILLISECONDS_IN_SECOND)
        return Number(decoded.exp) <= currentTime
    }
}

const JWT_SERVICE = new JwtService()

export { JwtService, JWT_SERVICE }
