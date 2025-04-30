"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useCurrentQuestion, useSurveyId } from "@/store/dropdown";
import Spinner from "./Spinner";
import { Progress } from "@/components/ui/progress"; // Importing the Progress component
import { useRouter } from "next/navigation";

interface survey {
  title: string;
  description: string | null;
  id: string;
  _count: {
    questions: number;
  };
  questions: { id: string }[];
}

const Surveytitdes = () => {
  const [survey, setSurvey] = useState<survey | null>(null);
  const router = useRouter();
  const { id, setId } = useSurveyId();
  const { data, setData } = useCurrentQuestion();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0); // State to track progress
  const BACKEND_LINK = process.env.NEXT_PUBLIC_BACKEND_LINK;

  useEffect(() => {
    // Function to fetch survey data
    const fetchSurvey = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_LINK}/v1/worker/checksurvey`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            validateStatus: (status) => status === 200 || status === 404,
          }
        );
        if (response.data.surveyWithNoResponses) {
          setSurvey(response.data.surveyWithNoResponses);
          setId(response.data.surveyWithNoResponses.id);
        } else if (response.data.surveyWithPartialResponses) {
          setSurvey(response.data.surveyWithPartialResponses);
          setId(response.data.surveyWithPartialResponses.id);
        } else {
          setError("No survey found");
          router.push("/surveys/response/tasksdone");
        }
      } catch (err) {
        console.log(err);
        console.error("Error fetching survey:", err);
      }
    };

    fetchSurvey();
  }, [id, data]); // Empty dependency array ensures the request runs only on component mount

  useEffect(() => {
    if (survey) {
      const totalQuestions = survey._count.questions;
      const answeredQuestions = totalQuestions - survey.questions.length;
      const progressValue = (answeredQuestions / totalQuestions) * 100;
      setProgress(progressValue); // Set progress as a percentage
    }
  }, [survey]); // Recalculate progress whenever the survey data changes

  if (error) {
    console.log(error);
    return <div>Error: {error}</div>;
  }

  if (!survey) {
    return (
      <div className="h-full w-full mt-10">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="flex p-5 px-10 flex-col gap-10 m-5 border-2 border-border">
        <h1 className="text-xl text-primary flex gap-5">
          <span>Survey Title:</span>{" "}
          <span className="text-foreground">{survey.title}</span>
        </h1>
        <h2 className="text-lg text-primary flex gap-5 flex-wrap">
          <span>Description:</span>
          <span className="text-foreground break-words">
            {survey.description}
          </span>
        </h2>
      </div>
      {/* Progress bar */}
      <div className="my-5 mx-4 p-5">
        <p className="text-lg font-semibold text-primary">Progress</p>
        <Progress value={progress} className="w-full" />
        <p className="mt-2 text-center text-sm">
          {Math.round(progress)}% completed
        </p>
      </div>
    </>
  );
};

export default Surveytitdes;
