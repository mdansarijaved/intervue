import { useEffect, type ReactNode } from "react";
import { SocketContext, socket } from "@/lib/socket";
import { useAppDispatch } from "@/store/hooks";
import { updatePollResults } from "@/store/slices/teacherSlice";
import { addMessage } from "@/store/slices/chatSlice";

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);

      socket.emit("join-chat");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("poll-created", (poll) => {
      console.log("Poll created:", poll);
    });

    socket.on("poll-started", (poll) => {
      console.log("Poll started:", poll);
    });

    socket.on("poll-ended", (poll) => {
      console.log("Poll ended:", poll);
    });

    socket.on("vote-submitted", ({ vote, liveResults }) => {
      console.log("Vote submitted:", vote);
      console.log("Live results:", liveResults);

      dispatch(
        updatePollResults({
          pollId: liveResults.poll.id,
          results: liveResults.results.map((result: any, index: number) => ({
            ...result,
            order: index,
          })),
          totalVotes: liveResults.poll.totalVotes,
        })
      );
    });

    socket.on(
      "chat-message",
      (msg: { id: string; user: string; text: string; timestamp: number }) => {
        dispatch(addMessage(msg));
      }
    );

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("poll-created");
      socket.off("poll-started");
      socket.off("poll-ended");
      socket.off("vote-submitted");
      socket.off("chat-message");
      socket.off("error");
      socket.disconnect();
    };
  }, [dispatch]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
