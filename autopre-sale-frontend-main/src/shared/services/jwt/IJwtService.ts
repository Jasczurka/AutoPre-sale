type IJwtResponse<TPayload> = TPayload & {
    exp: string
}

interface IJwtService {
    verify: <TPayload>(token: string) => TPayload
    isTokenExpired: (token: string) => boolean
}

export type { IJwtResponse, IJwtService }