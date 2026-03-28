const env = import.meta.env;

export const envs = Object.freeze({
	DEV: env.DEV,
	SOCKET: Object.freeze({
		ENABLE: env.VITE_ENABLE_SOCKET,
		PORT: env.VITE_SOCKET_PORT,
	}),
	SITE: Object.freeze({
		NAME: env.VITE_SITE_NAME,
		URL: env.VITE_BASE_URL ?? "",
	}),
});
