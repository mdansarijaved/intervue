import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updateFormQuestion,
  updateFormDescription,
  updateFormOption,
  addFormOption,
  removeFormOption,
  clearError,
  checkCanStartNewPoll,
  createPoll,
  startPoll,
} from "@/store/slices/teacherSlice";
import { useSocket } from "@/lib/socket";
import { loadUserFromStorage, logout } from "@/store/slices/userSlice";

export const Route = createFileRoute("/teacher")({
  component: TeacherComponent,
});

function TeacherComponent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const socket = useSocket();
  const { canStartNewPoll, activePollId, isLoading, error, formData } =
    useAppSelector((state) => state.teacher);

  const { isAuthenticated, role, name } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || role !== "TEACHER") {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (isAuthenticated && role === "TEACHER") {
      dispatch(checkCanStartNewPoll());

      socket.emit("join-teacher");

      return () => {
        socket.emit("leave-teacher");
      };
    }
  }, [dispatch, socket, isAuthenticated, role]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreatePoll = async () => {
    if (!formData.question.trim()) {
      toast.error("Question is required");
      return;
    }

    const validOptions = formData.options.filter(
      (opt) => opt.text.trim() !== ""
    );
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    try {
      await dispatch(
        createPoll({
          question: formData.question.trim(),
          description: formData.description.trim() || undefined,
          options: validOptions,
          teacherName: name,
        })
      ).unwrap();

      toast.success("Poll created successfully!");
      dispatch(checkCanStartNewPoll());
    } catch (error) {}
  };

  const handleStartPoll = async (pollId: string) => {
    try {
      await dispatch(
        startPoll({
          pollId,
          duration: 60,
        })
      ).unwrap();

      toast.success("Poll started successfully!");
      dispatch(checkCanStartNewPoll());
    } catch (error) {}
  };

  return <div className="container mx-auto max-w-4xl px-4 py-8"></div>;
}
