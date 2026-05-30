import type { Server } from "socket.io";

let io: Server | null = null;

export function setRealtime(server: Server) {
  io = server;
}

export function emitAdmin(event: string, payload: unknown) {
  io?.to("admin").emit(event, payload);
}

export function emitCart(cartId: string, event: string, payload: unknown) {
  io?.to(`cart:${cartId}`).emit(event, payload);
}
