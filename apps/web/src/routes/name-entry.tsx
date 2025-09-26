import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setUserName,
  setUserId,
  authenticateUser,
} from "@/store/slices/userSlice";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/name-entry")({
  component: NameEntryComponent,
});

function NameEntryComponent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { role, name } = useAppSelector((state) => state.user);
  const [inputName, setInputName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!role) {
      navigate({ to: "/" });
    }
  }, [role, navigate]);

  useEffect(() => {
    if (name) {
      setInputName(name);
    }
  }, [name]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!inputName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (inputName.trim().length < 2) {
      toast.error("Name must be at least 2 characters long");
      return;
    }

    if (!role) {
      toast.error("Role not selected. Please go back and select a role.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await trpcClient.users.create.mutate({
        name: inputName.trim(),
        role: role,
      });

      dispatch(setUserName(inputName.trim()));
      dispatch(setUserId(user.id));
      dispatch(authenticateUser());

      toast.success(`Welcome, ${inputName.trim()}!`);

      if (role === "TEACHER") {
        navigate({ to: "/create-question" });
      } else {
        navigate({ to: "/question" });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const getRoleIcon = () => {
    return role === "TEACHER" ? "👨‍🏫" : "🎓";
  };

  const getRoleTitle = () => {
    return role === "TEACHER" ? "Teacher Setup" : "Student Setup";
  };

  const getRoleDescription = () => {
    return role === "TEACHER"
      ? "Enter your name to start creating polls"
      : "Enter your name to join live polls";
  };

  if (!role) {
    return null;
  }

  return (
    <div className="container mx-auto grid justify-center h-screen items-center">
      <div className="text-center">
        <div className="flex justify-center ">
          <button className="bg-gradient-to-r flex gap-2 text-white items-center from-[#7565D9] font-semibold text-sm to-[#4D0ACD] px-[10.67px] py-[6.5px]  rounded-[24px] ">
            <img src="./Vector.svg" alt="icon" />
            Intervue Poll
          </button>
        </div>
        <div className="space-y-[31px]">
          <div className="leading-none  text-center  space-y-[12px] pt-[26px]">
            <p className="text-[40px] ">
              Let's <span className="font-semibold ">Get Started</span>
            </p>
            <p className="text-[19px] leading-6 max-w-[762px] text-[#5C5B5B]">
              {role === "STUDENT" ? (
                <>
                  If you're a student, you'll be able to{" "}
                  <span className="font-semibold text-black">
                    submit your answers
                  </span>
                  , participate in live polls, and see how your responses
                  compare with your classmates
                </>
              ) : (
                <>
                  As a teacher, you'll be able to{" "}
                  <span className="font-semibold text-black">create polls</span>
                  , manage live polling sessions, and view real-time results
                </>
              )}
            </p>
          </div>
          <div className=" flex justify-center items-center">
            <form onSubmit={handleSubmit} className=" ">
              <div className="w-[507px] flex flex-col gap-[12px] items-start">
                <label htmlFor="name" className="text-[18px] text-left">
                  Enter your name
                </label>
                <input
                  type="text"
                  id="name"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your name"
                  className="w-full h-[60px] py-[18px] px-[23px] bg-[#F2F2F2] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              <div className="mt-[46px]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-[34px] bg-gradient-to-l from-[#8F64E1] to-[#1D68BD] py-[17.29px] px-[73.47px]  font-semibold text-[18px] leading-none text-white hover:from-[#9F74F1] hover:to-[#2E78CD] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? "Creating Account..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
