import { createContext, useContext } from "react";
import { io, type Socket } from "socket.io-client";

const socket: Socket = io(
  import.meta.env.VITE_SERVER_URL ||
    "VITE_SERVER_URL=intervue-production-f51d.up.railway.app",
  {
    autoConnect: false,
  }
);

export const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
};

export { socket };
