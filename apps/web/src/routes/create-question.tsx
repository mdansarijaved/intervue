import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updateFormQuestion,
  updateFormOption,
  addFormOption,
  removeFormOption,
  createPoll,
  resetForm,
  clearError,
} from "@/store/slices/teacherSlice";
import { loadUserFromStorage } from "@/store/slices/userSlice";

export const Route = createFileRoute("/create-question")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { formData, isLoading, error, teacherName } = useAppSelector(
    (state) => state.teacher
  );
  const { name: userName } = useAppSelector((state) => state.user);

  const currentUserName = userName || teacherName || "";

  const [selectedTime, setSelectedTime] = useState("60");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);

  const timeOptions = [
    { value: "60", label: "60 Seconds" },
    { value: "120", label: "120 Seconds" },
    { value: "180", label: "180 Seconds" },
    { value: "240", label: "240 Seconds" },
  ];

  const handleTimeSelect = (value: string) => {
    setSelectedTime(value);
    setIsDropdownOpen(false);
  };

  const questionLength = formData.question.length;
  const maxQuestionLength = 100;

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const isFormValid =
    formData.question.trim().length > 0 &&
    formData.options.every((option) => option.text.trim().length > 0) &&
    formData.options.length >= 2 &&
    currentUserName.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid) {
      return;
    }

    try {
      const result = await dispatch(
        createPoll({
          question: formData.question.trim(),
          description: formData.description.trim() || undefined,
          options: formData.options.map((option) => ({
            text: option.text.trim(),
            order: option.order,
          })),
          teacherName: currentUserName,
        })
      ).unwrap();

      dispatch(resetForm());
      setCorrectAnswers([]);
      setSelectedTime("60");
      navigate({ to: "/polls" });
    } catch (error) {
      console.error("Failed to create poll:", error);
    }
  };

  return (
    <div className="grid justify-start items-center h-screen ">
      <div className="text-center px-[123px]">
        <div className="flex justify-start ">
          <button className="bg-gradient-to-r flex gap-2 text-white items-center from-[#7565D9] font-semibold text-sm to-[#4D0ACD] px-[10.67px] py-[6.5px]  rounded-[24px] sora">
            <img src="./Vector.svg" alt="icon" />
            Intervue Poll
          </button>
        </div>
        <div className="space-y-[31px]">
          <div className="leading-none sora text-left  space-y-[12px] pt-[26px]">
            <p className="text-[40px] ">
              Let’s <span className="font-semibold ">Get Started</span>
            </p>
            <p className="text-[19px] leading-6 max-w-[762px] text-[#5C5B5B]">
              you’ll have the ability to create and manage polls, ask questions,
              and monitor your students' responses in real-time.
            </p>
          </div>
          <div className=" flex justify-start items-center">
            <div className=" ">
              <div className="w-[865px] flex flex-col gap-[12px] items-start">
                <div className="flex justify-between items-center w-full">
                  <label htmlFor="name" className="text-[18px] text-left">
                    Enter your question
                  </label>
                  <div className="relative">
                    <div
                      className="bg-[#F1F1F1] border border-gray-300 px-4 py-2 rounded-none text-gray-700 cursor-pointer min-w-[120px] flex items-center justify-between"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span>
                        {
                          timeOptions.find((opt) => opt.value === selectedTime)
                            ?.label
                        }
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 w-full bg-[#F1F1F1] border border-gray-300 border-t-0 rounded-none z-10">
                        {timeOptions.map((option) => (
                          <div
                            key={option.value}
                            className="px-4 py-2 text-gray-700 cursor-pointer hover:bg-[#e5e5e5] transition-colors"
                            onClick={() => handleTimeSelect(option.value)}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}

                    <input type="hidden" name="time" value={selectedTime} />
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    id="name"
                    placeholder="Enter your question here..."
                    value={formData.question}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= maxQuestionLength) {
                        dispatch(updateFormQuestion(value));
                      }
                    }}
                    className="w-[865px] h-[174px] py-[18px] px-[23px] bg-[#F2F2F2]"
                  />
                  <span className="absolute bottom-[36px] text-sm leading-none right-[15px]">
                    {questionLength}/{maxQuestionLength}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start">
                <div className="flex flex-col items-start gap-3 mb-[25px] mt-[34px]">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-lg leading-none">
                      Edit Options
                    </p>
                    <p className="font-semibold text-lg leading-none">
                      Is it Correct?
                    </p>
                  </div>
                  {formData.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center gap-[34px] "
                    >
                      <div className="flex gap-3 items-center">
                        <span className="rounded-full bg-gradient-to-l from-[#8F64E1] to-[#4E377B] text-white font-semibold text-[11px] leading-none flex justify-center items-center size-6 py-[9px] px-[10px] ">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option.text}
                          onChange={(e) =>
                            dispatch(
                              updateFormOption({ index, text: e.target.value })
                            )
                          }
                          className="py-[18px] px-[23px] bg-[#F2F2F2] w-[507px] h-[60px] "
                        />
                        {formData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => dispatch(removeFormOption(index))}
                            className="text-red-500 hover:text-red-700 text-sm ml-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="flex gap-[18px]">
                        <div className="flex gap-2 items-center">
                          <input
                            type="radio"
                            id={`correct-${index}`}
                            name={`correct-${index}`}
                            checked={correctAnswers.includes(index)}
                            onChange={() => {
                              if (correctAnswers.includes(index)) {
                                setCorrectAnswers(
                                  correctAnswers.filter((i) => i !== index)
                                );
                              } else {
                                setCorrectAnswers([...correctAnswers, index]);
                              }
                            }}
                          />
                          <label
                            htmlFor={`correct-${index}`}
                            className="text-[18px] leading-none"
                          >
                            yes
                          </label>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="radio"
                            id={`incorrect-${index}`}
                            name={`correct-${index}`}
                            checked={!correctAnswers.includes(index)}
                            onChange={() => {
                              setCorrectAnswers(
                                correctAnswers.filter((i) => i !== index)
                              );
                            }}
                          />
                          <label
                            htmlFor={`incorrect-${index}`}
                            className="text-[18px] leading-none"
                          >
                            no
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-8">
                  <button
                    type="button"
                    onClick={() => dispatch(addFormOption())}
                    disabled={formData.options.length >= 4}
                    className={`w-[169px] h-[45px] rounded-[11px] border font-semibold text-sm ${
                      formData.options.length >= 4
                        ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-[#7451B6] bg-white text-[#7C57C2] hover:bg-gray-50"
                    }`}
                  >
                    + Add More option
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-[40px] flex justify-end items-center border-t w-screen border-[#B6B6B6] ">
        {error && <div className="mr-4 text-red-500 text-sm">{error}</div>}
        {!isFormValid && !isLoading && (
          <div className="mr-4 text-gray-500 text-sm">
            {formData.question.trim().length === 0 && "Question required. "}
            {!formData.options.every(
              (option) => option.text.trim().length > 0
            ) && "All options required. "}
            {currentUserName.trim().length === 0 &&
              "User name required (please complete setup). "}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !isFormValid}
          className={`rounded-[34px] bg-gradient-to-l from-[#8F64E1] w-[233.93408203125px] to-[#1D68BD] py-[17px] mt-5 font-semibold text-[18px] leading-none text-white ${
            isLoading || !isFormValid
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-90"
          }`}
        >
          {isLoading ? "Creating..." : "Ask Question"}
        </button>
      </div>
    </div>
  );
}
