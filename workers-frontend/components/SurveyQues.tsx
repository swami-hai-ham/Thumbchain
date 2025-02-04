"use client";
import React, { useEffect } from "react";
// import DateInp from "./Form/DateInp";
import axios from "axios";
import { useCurrentQuestion } from "@/store/dropdown";
import Multichoice from "./Form/Multichoice";
import Checkbox from "./Form/Checkbox";
import Uinp from "./Form/Unip";
import DateInp from "./Form/DateInp";

interface Question {
  question: string;
  type: string;
  options: string[] | null;
  orderId: number;
  questionId: string;
  formId: string;
  description: string | null;
}

const SurveyQues = () => {
  const { data, setData } = useCurrentQuestion();

  const renderQuestionComponent = (question: Question) => {
    // console.log(question);
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return (
          <Multichoice
            formId={question.formId}
            options={question.options}
            orderId={question.orderId}
            question={question.question}
            questionId={question.questionId}
            type={question.type}
          />
        );
      case "CHECKBOXES":
        return (
          <Checkbox
            formId={question.formId}
            options={question.options}
            orderId={question.orderId}
            question={question.question}
            questionId={question.questionId}
            type={question.type}
          />
        );
      case "TEXT":
        return (
          <Uinp
            formId={question.formId}
            description={question.description}
            orderId={question.orderId}
            question={question.question}
            questionId={question.questionId}
            type={question.type}
          />
        );
      case "DATE":
        return (
          <DateInp
            formId={question.formId}
            orderId={question.orderId}
            question={question.question}
            questionId={question.questionId}
            type={question.type}
          />
        );
      default:
        return null;
    }
  };
  useEffect(() => {
    const fetchNextQuestion = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found in localStorage");
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_LINK}/v1/worker/nextquestion`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.question) {
          setData({
            question: response.data.question.question,
            type: response.data.question.type,
            options: response.data.question.options,
            orderId: response.data.question.orderId,
            questionId: response.data.question.id,
            formId: response.data.question.formId,
            description: response.data.question.description,
          });
        }
      } catch (error) {
        // console.error("Error fetching the next question:", error);
      }
    };

    fetchNextQuestion();
  }, []);

  return (
    <div className="w-full h-full">{data && renderQuestionComponent(data)}</div>
  );
};

export default SurveyQues;
