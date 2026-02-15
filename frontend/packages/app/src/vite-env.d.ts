/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_BASE_URL: string;
	readonly VITE_SITE_NAME: string;
	readonly VITE_ENABLE_SOCKET: string;
	readonly VITE_SOCKET_PORT: number;
	readonly DEV: boolean;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
