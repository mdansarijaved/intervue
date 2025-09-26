import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center pt-8 space-y-[34px]">
      <div className="flex justify-center ">
        <button className="bg-gradient-to-r flex gap-2 text-white items-center from-[#7565D9] font-semibold text-sm to-[#4D0ACD] px-[10.67px] py-[6.5px]  rounded-[24px] sora">
          <img src="./Vector.svg" alt="icon" />
          Intervue Poll
        </button>
      </div>
      <Loader2 className="animate-spin text-[#500ECE]" />

      <div>
        <p className="text-[33px] font-semibold leading-none">
          Wait for the teacher to ask questions.
        </p>
      </div>
    </div>
  );
}
