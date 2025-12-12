import {router} from "./routes.tsx";

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

interface ImportMetaEnv {
    readonly VITE_API_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
