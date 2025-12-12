import {HttpService} from "./HttpService";

// Access Vite environment variable with type assertion
// Vite injects env variables at build time
const DEFAULT_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

const HTTP_APP_SERVICE = new HttpService({
    baseURL: DEFAULT_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

export { HTTP_APP_SERVICE }