const ROOT_AUTH = "auth:"
enum EQueryKeys {
    GET_ME = `${ROOT_AUTH}get-me`,
    ANALYSIS_TZ = `analysis:get-backlog`,
    PROJECTS = 'projects:',
}

enum EMutationKeys {
    REGISTER = `${ROOT_AUTH}register`,
    SIGN_IN = `${ROOT_AUTH}login`,
    SIGN_OUT = `${ROOT_AUTH}sign-out`,
    REFRESH_TOKEN = `${ROOT_AUTH}refresh-token`,
}

enum EAuthAPI {
    ROOT = "/api/auth-service/Auth/",
    GET_ME = `${ROOT}me`,
    REGISTER = `${ROOT}register`,
    SIGN_IN = `${ROOT}login`,
    SIGN_OUT = `${ROOT}sign-out`,
    REFRESH_TOKEN = `${ROOT}refresh-token`,
}

export { EQueryKeys, EMutationKeys, EAuthAPI };