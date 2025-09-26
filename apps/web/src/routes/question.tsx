import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageSquare, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useSocket } from "@/lib/socket";
import { trpcClient } from "@/utils/trpc";

import {
  submitVote,
  setStudentName,
  loadStudentName,
  setJoinedPollId,
  checkHasVoted,
} from "@/store/slices/studentSlice";
import { loadUserFromStorage } from "@/store/slices/userSlice";
import ChatWidget from "@/components/chat-widget";

export const Route = createFileRoute("/question")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const socket = useSocket();

  const { hasVoted, selectedOptionId, isLoading, error, studentName } =
    useAppSelector((state) => state.student);
  const { name: userName, role } = useAppSelector((state) => state.user);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const currentStudentName = studentName || userName || "";

  const {
    data: activePoll,
    isLoading: pollLoading,
    error: pollError,
    refetch: refetchPoll,
  } = useQuery({
    queryKey: ["polls", "nextForStudent", currentStudentName],
    queryFn: () => {
      if (!currentStudentName) return null as any;
      return trpcClient.polls.getNextPollForStudent.query({
        studentName: currentStudentName,
      });
    },
    enabled: !!currentStudentName,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    dispatch(loadUserFromStorage());
    dispatch(loadStudentName());

    if (role && role !== "STUDENT") {
      navigate({ to: "/" });
    }
  }, [dispatch, role, navigate]);

  useEffect(() => {
    if (socket && currentStudentName) {
      socket.emit("join-student-room", { studentName: currentStudentName });

      const handleVoteSubmitted = ({ vote, liveResults }: any) => {
        refetchPoll();
      };

      socket.on("vote-submitted", handleVoteSubmitted);

      return () => {
        socket.off("vote-submitted", handleVoteSubmitted);
      };
    }
  }, [socket, currentStudentName, refetchPoll]);

  useEffect(() => {
    if (activePoll && currentStudentName && activePoll.status === "ACTIVE") {
      dispatch(
        checkHasVoted({
          pollId: activePoll.id,
          studentName: currentStudentName,
        })
      );
      dispatch(setJoinedPollId(activePoll.id));
      setSelectedOption(null);
    }
  }, [activePoll?.id, currentStudentName, dispatch]);

  useEffect(() => {
    if (activePoll && activePoll.endsAt && activePoll.status === "ACTIVE") {
      const endTime = new Date(activePoll.endsAt).getTime();

      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setCountdown(remaining);

        if (remaining === 0) {
          setCountdown(null);
          refetchPoll();
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [activePoll, refetchPoll]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleOptionSelect = (optionId: string) => {
    if (!hasVoted && !isLoading && activePoll?.status === "ACTIVE") {
      setSelectedOption(optionId);
    }
  };

  const handleSubmitVote = async () => {
    if (
      !selectedOption ||
      !activePoll ||
      !currentStudentName ||
      hasVoted ||
      isLoading
    ) {
      return;
    }

    try {
      await dispatch(
        submitVote({
          pollId: activePoll.id,
          optionId: selectedOption,
          studentName: currentStudentName,
        })
      ).unwrap();

      dispatch(setJoinedPollId(activePoll.id));
      setSelectedOption(null);
      refetchPoll();
    } catch (error) {}
  };

  if (!activePoll && !pollLoading) {
    return (
      <div className="min-h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            All Questions Completed! 🎉
          </h2>
          <p className="text-gray-600">You have answered 0 out of 0 polls.</p>
          <p className="text-gray-500 text-sm mt-2">
            Thank you for participating!
          </p>
        </div>
        <ChatWidget teacherName={null} />
      </div>
    );
  }

  if (pollLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h2>
          <p className="text-gray-600">Checking for active polls...</p>
        </div>
        <ChatWidget teacherName={null} />
      </div>
    );
  }

  if (!activePoll && pollError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Poll
          </h2>
          <p className="text-gray-600 mb-4">{(pollError as any).message}</p>
        </div>
        <ChatWidget teacherName={null} />
      </div>
    );
  }

  if (!activePoll) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 relative ">
      <div className="max-w-[727px] h-screen mx-auto flex flex-col justify-center items-center  w-full ">
        <div className="flex justify-start gap-[35px] items-center mb-[25px] w-full">
          <h1 className="text-3xl font-bold text-gray-800">Question 1</h1>
          <div className="flex items-end justify-center text-xl gap-1.5">
            <Timer className="size-6" />
            <span className="text-[#CB1206] leading-none">
              {countdown !== null ? formatTime(countdown) : "--:--"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[9px] overflow-hidden mb-[29px] w-full">
          <div className="bg-gradient-to-l from-[#343434] to-[#6E6E6E] text-white px-4 py-[14.5px]">
            <h2 className="text-[22px] leading-none font-semibold">
              {activePoll.question}
            </h2>
          </div>

          <div className="px-4  space-y-[11px] pt-[35px] pb-4">
            {activePoll.options
              .sort((a: any, b: any) => a.order - b.order)
              .map((option: any, index: number) => {
                const isSelected =
                  selectedOption === option.id ||
                  selectedOptionId === option.id;
                const isDisabled =
                  hasVoted || activePoll.status !== "ACTIVE" || isLoading;

                return (
                  <label
                    key={option.id}
                    className={`flex items-center py-3.5 px-5 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? "border-purple-500"
                        : isDisabled
                        ? "border-gray-200 opacity-60"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !isDisabled && handleOptionSelect(option.id)}
                  >
                    <div
                      className={`size-6 rounded-full text-white text-xs flex items-center justify-center mr-2.5 font-semibold ${
                        isSelected
                          ? "bg-gradient-to-r from-[#8F64E1] to-[#4E377B]"
                          : "bg-[#8D8D8D]"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="flex-1 text-gray-800">{option.text}</span>
                    {hasVoted && isSelected && (
                      <span className="text-green-600 text-sm font-medium">
                        ✓ Voted
                      </span>
                    )}
                  </label>
                );
              })}
          </div>
        </div>

        <div className="flex justify-end items-center w-full">
          {error && <div className="mr-4 text-red-500 text-sm">{error}</div>}
          <button
            onClick={handleSubmitVote}
            disabled={
              !selectedOption ||
              hasVoted ||
              isLoading ||
              activePoll.status !== "ACTIVE"
            }
            className={`px-8 py-3 rounded-[34px] w-[233.93408203125px] font-semibold text-lg transition-all duration-200 ${
              hasVoted
                ? "bg-green-500 text-white cursor-not-allowed"
                : !selectedOption || isLoading || activePoll.status !== "ACTIVE"
                ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-[#8F64E1] to-[#1D68BD] text-white hover:opacity-90"
            }`}
          >
            {isLoading
              ? "Submitting..."
              : hasVoted
              ? "Vote Submitted"
              : activePoll.status !== "ACTIVE"
              ? "Poll Ended"
              : "Submit"}
          </button>
        </div>
      </div>
      <ChatWidget teacherName={null} />
    </div>
  );
}
