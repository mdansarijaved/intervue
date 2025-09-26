import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useSocket } from "@/lib/socket";
import { trpcClient } from "@/utils/trpc";
import { loadUserFromStorage } from "@/store/slices/userSlice";
import ChatWidget from "@/components/chat-widget";

export const Route = createFileRoute("/polls")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const socket = useSocket();

  const { name: userName, role } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (role && role !== "TEACHER") {
      navigate({ to: "/" });
    }
  }, [role, navigate]);

  const {
    data: polls,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacher", "polls", userName ?? "all"],
    queryFn: async () => {
      const all = await trpcClient.polls.getAll.query();
      const teacherPolls = userName
        ? all.filter((p: any) => p.createdBy?.name === userName)
        : all;

      return teacherPolls.map((poll: any) => {
        const totalVotes = poll._count?.votes || 0;
        const options = (poll.options || []).map((opt: any, idx: number) => {
          const votes = opt._count?.votes || 0;
          const percentage =
            totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          return {
            id: opt.id,
            text: opt.text,
            order: opt.order ?? idx,
            votes,
            percentage,
          };
        });
        return {
          id: poll.id,
          question: poll.question,
          status: poll.status,
          createdAt: poll.createdAt,
          options: options.sort((a: any, b: any) => a.order - b.order),
          totalVotes,
        };
      });
    },
    refetchInterval: 0,
  });

  useEffect(() => {
    socket.emit("join-teacher");

    const handleCreated = () => refetch();
    const handleStarted = () => refetch();
    const handleEnded = () => refetch();
    const handleVote = () => refetch();

    socket.on("poll-created", handleCreated);
    socket.on("poll-started", handleStarted);
    socket.on("poll-ended", handleEnded);
    socket.on("vote-submitted", handleVote);

    return () => {
      socket.off("poll-created", handleCreated);
      socket.off("poll-started", handleStarted);
      socket.off("poll-ended", handleEnded);
      socket.off("vote-submitted", handleVote);
    };
  }, [socket, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Loading Polls...
          </h2>
          <p className="text-gray-600">Fetching your poll history</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Polls
          </h2>
          <p className="text-gray-600 mb-4">
            {(error as any).message || "Something went wrong"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!polls || polls.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            View Poll History
          </h2>
          <p className="text-gray-600">No polls found for your account yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 relative ">
      <div className="max-w-[900px] mx-auto py-12 px-2">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          View <span className="font-extrabold">Poll History</span>
        </h1>

        <div className="space-y-12">
          {polls.map((poll: any, idx: number) => (
            <div key={poll.id} className="">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Question {idx + 1}
              </h2>

              <div className="bg-white rounded-[9px] overflow-hidden w-full border border-purple-200">
                <div className="bg-gradient-to-l from-[#343434] to-[#6E6E6E] text-white px-4 py-[14.5px]">
                  <h3 className="text-[22px] leading-none font-semibold">
                    {poll.question}
                  </h3>
                </div>

                <div className="px-4 space-y-[11px] pt-[35px] pb-4">
                  {poll.options.map((option: any, optionIndex: number) => (
                    <div
                      key={option.id}
                      className="rounded-lg border-2 border-purple-200 relative overflow-hidden"
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-[#6B5FD3] transition-all duration-300"
                        style={{ width: `${option.percentage}%` }}
                      />

                      <div className="relative z-10 flex items-center py-3.5 px-5 gap-3">
                        <div className="size-6 rounded-full bg-gradient-to-r from-[#8F64E1] to-[#4E377B] text-white flex items-center justify-center text-xs font-semibold">
                          {optionIndex + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`${
                                option.percentage >= 20
                                  ? "text-white"
                                  : "text-gray-800"
                              } font-medium`}
                            >
                              {option.text}
                            </span>
                            <span className="text-white text-sm">
                              {option.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex w-full justify-end items-center">
          <button
            onClick={() => navigate({ to: "/create-question" })}
            className={`rounded-[34px] bg-gradient-to-l from-[#8F64E1] w-[233.93408203125px] to-[#1D68BD] py-[17px] mt-7 font-semibold text-[18px] leading-none text-white `}
          >
            Ask a new question
          </button>
        </div>
      </div>

      {/* Reusable chat widget */}
      <ChatWidget teacherName={userName} />
    </div>
  );
}
