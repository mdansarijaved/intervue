import { setUserRole } from "@/store/slices/userSlice";
import { useAppDispatch } from "@/store/hooks";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<
    "TEACHER" | "STUDENT" | null
  >(null);

  const handleRoleSelect = (role: "TEACHER" | "STUDENT") => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }
    dispatch(setUserRole(selectedRole));
    navigate({ to: "/name-entry" });
  };

  return (
    <div className="container mx-auto grid justify-center h-screen items-center">
      <div className="text-center">
        <div className="flex justify-center ">
          <button className="bg-gradient-to-r flex gap-2 text-white items-center from-[#7565D9] font-semibold text-sm to-[#4D0ACD] px-[10.67px] py-[6.5px]  rounded-[24px] sora">
            <img src="./Vector.svg" alt="icon" />
            Intervue Poll
          </button>
        </div>
        <div className="space-y-[50px]">
          <div className="mt-[26px]">
            <div className="w-[737px] h-[103px] space-y-[5px] leading-none">
              <p className="sora text-[40px] ">
                Welcome to the{" "}
                <span className="font-semibold">Live Polling System</span>
              </p>
              <p className="text-[#000000]/50 text-[19px]  text-center">
                Please select the role that best describes you to begin using
                the live polling system
              </p>
            </div>
          </div>
          <div className=" grid grid-cols-2 gap-[32px] leading-none">
            <button
              onClick={() => handleRoleSelect("STUDENT")}
              className={`relative w-[387px] h-[143px] rounded-[10px] py-[15px] pr-[17px] pl-[25px] flex flex-col gap-[17px] before:absolute before:inset-0 before:rounded-[10px] before:p-[3px] before:-z-10 after:absolute after:inset-[3px] after:rounded-[7px] after:bg-white after:-z-10 text-left justify-center transition-all duration-200 cursor-pointer ${
                selectedRole === "STUDENT"
                  ? "before:bg-gradient-to-r before:from-[#7765DA] before:to-[#1D68BD]"
                  : "before:bg-[#D9D9D9] hover:before:bg-gradient-to-r hover:before:from-[#7765DA] hover:before:to-[#1D68BD]"
              }`}
            >
              <p className="sora font-semibold text-[23px] ">I'm a Student</p>
              <p className="text-[#454545] sora">
                Submit answers and view live poll results in real-time
              </p>
            </button>
            <button
              onClick={() => handleRoleSelect("TEACHER")}
              className={`relative w-[387px] h-[143px] rounded-[10px] py-[15px] pr-[17px] pl-[25px] flex flex-col gap-[17px] before:absolute before:inset-0 before:rounded-[10px] before:p-[3px] before:-z-10 after:absolute after:inset-[3px] after:rounded-[7px] after:bg-white after:-z-10 text-left justify-center transition-all duration-200 cursor-pointer ${
                selectedRole === "TEACHER"
                  ? "before:bg-gradient-to-r before:from-[#7765DA] before:to-[#1D68BD]"
                  : "before:bg-[#D9D9D9] hover:before:bg-gradient-to-r hover:before:from-[#7765DA] hover:before:to-[#1D68BD]"
              }`}
            >
              <p className="sora font-semibold text-[23px]">I'm a Teacher</p>
              <p className="text-[#454545] sora">
                Create polls and manage live polling sessions
              </p>
            </button>
          </div>
        </div>
        <div className="mt-[46px]">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="rounded-[34px] bg-gradient-to-l from-[#8F64E1] to-[#1D68BD] py-[17.29px] px-[73.47px]  font-semibold text-[18px] leading-none text-white hover:from-[#9F74F1] hover:to-[#2E78CD] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
