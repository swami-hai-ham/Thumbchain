"use client";
import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Spinner from "../Spinner";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useCurrentQuestion } from "@/store/dropdown";
import { useRouter } from "next/navigation";
import { formatQuestionType } from "@/lib/func";

interface Question {
  question: string;
  type: string;
  orderId: number;
  questionId: string;
  formId: string;
}

const DateInp = (Ques: Question) => {
  const [isoDate, setIsoDate] = React.useState<string | null>(null);
  const { data, setData } = useCurrentQuestion();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setIsoDate(selectedDate.toISOString()); // Save ISO string
    } else {
      setIsoDate(null);
    }
  };

  return (
    <div className=" m-10 flex-[3] h-full p-2 border-border border-[1px]">
      <div
        className="Date flex flex-col gap-3 m-4"
        onClick={() => {
          console.log(isoDate);
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex justify-center items-center gap-5">
            <span className="text-2xl text-primary">Question:</span>{" "}
            {Ques.question}
          </div>
          <span className="border-2 border-primary p-3">
            {formatQuestionType(Ques.type)}
          </span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left !p-6 rounded-xl flex items-center gap-2 mt-4 mx-4",
                !isoDate && "text-muted-background"
              )}
            >
              <CalendarIcon className="w-[20px] h-[20px]" />
              {isoDate ? (
                format(parseISO(isoDate), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className=" w-auto p-0">
            <Calendar
              mode="single"
              selected={isoDate ? parseISO(isoDate) : undefined} // Convert ISO string back to Date
              fromYear={1960}
              onSelect={handleDateChange} // Handle as Date
              toYear={2050}
              captionLayout="dropdown-buttons"
            />
          </PopoverContent>
        </Popover>
        {loading ? (
          <div className="rounded-2xl p-2 border-2 border-border w-56 mx-auto">
            <Spinner />
          </div>
        ) : (
          <button
            disabled={!isoDate}
            className="rounded-2xl p-2 border-2 border-border w-32 mx-auto"
            onClick={async () => {
              setLoading(true);
              const body = {
                questionId: Ques.questionId,
                formId: Ques.formId,
                type: Ques.type,
                answer: isoDate,
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
                    }
                  );
                  if (Question.status == 404) {
                    router.push("/surveys/tasksdone");
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

export default DateInp;
