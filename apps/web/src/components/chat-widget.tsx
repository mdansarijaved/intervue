import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useSocket } from "@/lib/socket";
import { addMessage } from "@/store/slices/chatSlice";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

interface ChatWidgetProps {
  teacherName?: string | null;
}

export default function ChatWidget({ teacherName }: ChatWidgetProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();
  const { name: userName } = useAppSelector((s) => s.user);
  const messages = useAppSelector((s) => s.chat.messages);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [chatText, setChatText] = useState("");

  const { data: participants } = useQuery({
    queryKey: ["chat", "participants", teacherName ?? "all"],
    queryFn: async () => {
      return await trpcClient.polls.getParticipants.query({
        teacherName: teacherName || undefined,
      });
    },
    enabled: !!teacherName,
  });

  const handleSend = () => {
    const text = chatText.trim();
    if (!text) return;
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user: userName || "Anonymous",
      text,
      timestamp: Date.now(),
    };
    dispatch(addMessage(msg));
    socket.emit("chat-message", msg);
    setChatText("");
  };

  const handleKick = (userId: string) => {
    socket.emit("kick-user", { userId });
  };

  return (
    <>
      <div className="w-full">
        <div
          className="size-20 rounded-full text-white fixed bottom-[50px] right-8 grid place-items-center bg-[#8F64E1] cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <MessageSquare className="size-10" />
        </div>
      </div>

      {isOpen && (
        <div className="fixed bottom-36 z-50 right-8 w-[429px] h-[477px] bg-white rounded-lg shadow-2xl border border-[#C5C5C5] flex flex-col overflow-hidden">
          <div className="border-b border-[#C5C5C5] flex items-center justify-between px-4">
            <div className="flex gap-6 text-sm font-medium">
              <button
                className={`py-3 ${
                  activeTab === "chat"
                    ? "text-gray-900 border-b-4 border-[#8F64E1]"
                    : "text-gray-400 border-b-2 border-transparent"
                }`}
                onClick={() => setActiveTab("chat")}
              >
                Chat
              </button>
              <button
                className={`py-3 ${
                  activeTab === "participants"
                    ? "text-gray-900 border-b-4 border-[#8F64E1]"
                    : "text-gray-400 border-b-2 border-transparent"
                }`}
                onClick={() => setActiveTab("participants")}
              >
                Participants
              </button>
            </div>
          </div>

          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.user === (userName || "Anonymous")
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div className={``}>
                      <div className="text-xs text-right mb-1 text-[#8F64E1]">
                        {m.user}
                      </div>
                      <div
                        className={` rounded-tl-lg rounded-br-lg rounded-bl-lg px-3 p-2.5 text-sm ${
                          m.user === (userName || "Anonymous")
                            ? "bg-[#8F64E1] text-white"
                            : "bg-[#3A3A3B] text-white"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#C5C5C5] p-2 flex items-center gap-2">
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border border-[#C5C5C5] rounded-md px-3 py-2 outline-none"
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-3 rounded-md bg-[#8F64E1] text-white font-semibold"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="grid grid-cols-2 text-[#726F6F] text-sm pb-3 ">
                <div>Name</div>
                <div className="text-right pr-2 text-[#726F6F]">Action</div>
              </div>
              <div className="">
                {(participants || []).length === 0 ? (
                  <div className="text-sm text-gray-500 py-3">
                    No participants yet.
                  </div>
                ) : (
                  (participants || []).map((p: any) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-2 items-center py-3"
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {p.name}
                      </div>
                      <div className="text-right pr-2">
                        <button
                          onClick={() => handleKick(p.id)}
                          className="text-[#1D68BD] text-sm font-semibold hover:underline"
                        >
                          Kick out
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
