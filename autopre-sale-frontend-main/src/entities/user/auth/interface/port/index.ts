interface IRegisterPort {
    firstName: string
    lastName: string
    middleName: string | null
    email: string
    password: string
}

interface ISignInPort {
    email: string,
    password: string
}

interface IRefreshPort {
    refreshToken: string;
    userId: string;
}

export type {IRegisterPort, ISignInPort, IRefreshPort}