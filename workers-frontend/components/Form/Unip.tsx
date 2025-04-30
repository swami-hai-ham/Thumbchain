import React, { useState } from "react";
import { Textarea } from "../ui/textarea";
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
  description: string | null;
  orderId: number;
  questionId: string;
  formId: string;
}
const Uinp = (Ques: Question) => {
  const [Answer, setAnswer] = useState<string | null>(null);
  const { data, setData } = useCurrentQuestion();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { recaptchaRef } = useReCAPTCHA();
  const handleAnsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(event.target.value); // Update selected option
  };
  return (
    <div className=" m-10 flex-[3] h-full p-2 border-border border-[1px]">
      <div className="Uinp flex flex-col gap-3 m-4">
        <div className="flex justify-between items-center">
          <div className="flex justify-center items-center gap-5">
            <span className="text-2xl text-primary">Question:</span>{" "}
            <span className="text-lg">{Ques.question}</span>
          </div>
          <span className="border-2 border-primary p-3">
            {formatQuestionType(Ques.type)}
          </span>
        </div>
        {Ques.description && (
          <label
            htmlFor=""
            className="text-xl mx-5 flex gap-3 items-center mt-2"
          >
            <span className="text-md text-primary">Description:</span>{" "}
            <span className="text-sm">{Ques.description}</span>
          </label>
        )}
        <Textarea
          placeholder="Your Answer"
          onChange={handleAnsChange}
          className="text-foreground border-border placeholder:text-border !text-xl w-full h-full mx-5 mt-2"
        />
        {loading ? (
          <div className="rounded-2xl p-2 border-2 border-border w-56 mx-auto">
            <Spinner />
          </div>
        ) : (
          <button
            disabled={!Answer}
            className="rounded-2xl p-2 border-2 border-border w-32 mx-auto"
            onClick={async () => {
              setLoading(true);
              await recaptcha_func(recaptchaRef);
              const body = {
                questionId: Ques.questionId,
                formId: Ques.formId,
                type: Ques.type,
                answer: Answer,
              };
              try {
                const response = await axios.post(
                  `${process.env.NEXT_PUBLIC_BACKEND_LINK}/v1/worker/response`,
                  body,
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        )}
      </div>
    </div>
  );
};
export default Uinp;
