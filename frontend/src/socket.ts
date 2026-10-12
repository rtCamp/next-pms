import { inject, type InjectionKey } from "vue";
import { io, type Socket } from "socket.io-client";

export const socketKey: InjectionKey<Socket> = Symbol("socket");

function socketHost(boot: Boot): string {
  const { protocol, hostname, origin } = window.location;
  if (!import.meta.env.DEV) return origin;
  return `${protocol}//${hostname}:${boot.socketio_port ?? 9000}`;
}

export function createSocket(boot: Boot): Socket {
  return io(`${socketHost(boot)}/${boot.sitename}`, {
    withCredentials: true,
    reconnectionAttempts: 3,
  });
}

export function useSocket(): Socket {
  const socket = inject(socketKey);
  if (!socket) throw new Error("useSocket() called outside the app");
  return socket;
}
