"use client";
import React, { useState } from "react";
import Spinner from "../Spinner";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useCurrentQuestion } from "@/store/dropdown";
import { useRouter } from "next/navigation";
import { formatQuestionType } from "@/lib/func";
import { recaptcha_func, useReCAPTCHA } from "@/lib/recaptcha";

interface Question {
  question: string;
  type: string;
  options: string[] | null;
  orderId: number;
  questionId: string;
  formId: string;
}

const Multichoice = (props: { Ques: Question }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { Ques } = props;
  const { data, setData } = useCurrentQuestion();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value); // Update selected option
  };
  const { recaptchaRef } = useReCAPTCHA();
  return (
    <div
      className=" m-10 flex-[3] h-full p-2 border-border border-[1px]"
      onClick={() => {
        console.log(Ques);
      }}
    >
      <div className="multichoice flex flex-col gap-3 m-4">
        <div className="flex justify-between items-center">
          <div className="flex justify-center items-center gap-5">
            <span className="text-2xl text-primary">Question:</span>{" "}
            <span className="text-lg">{Ques.question}</span>
          </div>
          <span className="border-2 border-primary p-3">
            {formatQuestionType(Ques.type)}
          </span>
        </div>
        <div className="flex justify-center items-center m-5 gap-2">
          <div className="flex h-full w-full gap-2 flex-col">
            {Ques.options?.map((op: string, opIndex: number) => (
              <div className="flex items-center my-2" key={opIndex}>
                <input
                  id={`${Ques.questionId}-option-${opIndex}`}
                  type="radio"
                  value={op}
                  name={Ques.questionId}
                  onChange={handleOptionChange}
                  className="w-4 h-4 rounded-full border border-foreground appearance-none checked:bg-accent checked:border-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
                />
                <label
                  htmlFor={`${Ques.questionId}-option-${opIndex}`}
                  className="ms-2 text-lg font-medium text-foreground dark:text-background flex justify-between w-full items-center"
                >
                  {op}
                </label>
              </div>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="rounded-2xl p-2 border-2 border-border w-56 mx-auto">
            <Spinner />
          </div>
        ) : (
          <>
            <button
              disabled={!selectedOption}
              className="rounded-2xl text-lg p-2 border-2 border-border w-32 mx-auto"
              onClick={async () => {
                setLoading(true);
                console.log("recaptcha");

                await recaptcha_func(recaptchaRef);
                const body = {
                  questionId: Ques.questionId,
                  formId: Ques.formId,
                  type: Ques.type,
                  answer: selectedOption,
                };
                try {
                  const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_LINK}/v1/worker/response`,
                    body,
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                          "token"
                        )}`,
                      },
                    }
                  );
                  if (response.status == 200) {
                    toast({
                      title: "Submission successful",
                      className: "bg-green-500 rounded-xl text-xl",
                      duration: 3000,
                    });
                    const Question = await axios.get(
                      `${process.env.NEXT_PUBLIC_BACKEND_LINK}/v1/worker/nextquestion`,
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                        validateStatus: (status) =>
                          status === 200 || status === 404,
                      }
                    );
                    if (Question.status == 404) {
                      router.push("/surveys/response/tasksdone");
                    } else if (Question.data.question) {
                      setData({
                        question: Question.data.question.question,
                        type: Question.data.question.type,
                        options: Question.data.question.options,
                        orderId: Question.data.question.orderId,
                        questionId: Question.data.question.id,
                        formId: Question.data.question.formId,
                        description: Question.data.question.description,
                      });
                    }
                  }
                } catch (e) {
                  console.log(e);
                  toast({
                    title: "Internal Server Error",
                    description: `${e}`,
                    variant: "destructive",
                    className: "bg-red-500 rounded-xl text-xl",
                  });
                }
                setLoading(false);
              }}
              type="button"
            >
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default Multichoice;
