/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PORTAL: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
