import { createContext, useContext } from "react";
import { io, type Socket } from "socket.io-client";

// Create socket instance
const socket: Socket = io(
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000",
  {
    autoConnect: false, // We'll connect manually
  }
);

// Socket context
export const SocketContext = createContext<Socket | null>(null);

// Hook to use socket
export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
};

export { socket };
