"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import React, {useRef, useState} from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Spinner from "@/components/Spinner";
import axios from "axios";
import { useDropdownStore } from "@/store/dropdown";

type ThumbnailOption = {
  id: number;
  image_url: string;
  task_id: number;
};

type Task = {
  title: string;
  options: ThumbnailOption[];
  id: number;
  amount: number;
} | null;


const TaskPage = () => {
  const searchParams = useSearchParams(); // Getting the query params
  const taskData = searchParams.get("task"); // Extract 'task' from query string
  
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState(null);
  const router = useRouter();
  const { countryValue } = useDropdownStore();

  
  

  // Check if taskData contains the no tasks message
  let task: Task;
  try {
    task = taskData ? JSON.parse(taskData) : null;
  } catch (error) {
    console.error("Error parsing task data:", error);
    task = null; // Fallback if parsing fails
  }

  
  const handleClick = async () => {
    setLoading(true);
    try {
      const body = {
        taskId: `${task?.id}`,
        selection: `${selection}`,
      };
      console.log(body);
  
      // Make the submission and get the next task or 404 response
      const response = await axios.post(
        `http://localhost:3003/v1/worker/submission?country=${countryValue}`,
        body,
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3JrZXJJZCI6MTIsImlhdCI6MTcyODMxNjU4NX0.a8i_sY0zWQhpbXima5uFdt5osLb_4ZCHF57v2hTO9yI",
          },
        }
      );
  
      // If a next task is returned, redirect to it
      if (response.status === 200 && response.data.nextTask) {
        router.push(
          `/thumbnail/nexttask?task=${encodeURIComponent(
            JSON.stringify(response.data.nextTask)
          )}`
        );
      }
  
      // If no tasks are left (404), redirect to "All tasks are done" page
      if (response.status === 404) {
        router.push("/thumbnail/tasksdone");
      }
    } catch (error) {
      console.error("Error submitting task", error);
    } finally {
      setLoading(false);
    }
  };
  
  
  
  

  return (
    <div className="flex flex-col items-center p-6 h-screen w-full text-foreground">
      <h1 className="text-4xl font-bold font-montserrat my-10">{task?.title}</h1>
      <div className="flex justify-between  items-center gap-10 w-full mx-5 px-20 my-6 h-1/2">
            {task?.options.map((option: any) => (
            <div key={option.id} className="relative images">
                <img
                src={option.image_url}
                style={{
                    width: "auto",  // Allows maintaining aspect ratio
                    height: "150px", // Max height cap to keep a uniform layout
                }}
                className={`shadow-md object-contain rounded-lg transition-transform duration-200 group-hover:scale-105 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,123,255,0.6)] ${selection == option.id ? "border-2 border-accent transition-all " : ""}`}
                alt={`Option ${option.id}`}
                onClick={() => {
                  if(option.id != selection){
                    setSelection(option.id)
                  }else{
                    setSelection(null)
                  }
                }}
                />
            </div>
            ))}
        </div>
        <button disabled={loading || selection == null}  className={`submit font-poppins text-foreground m-20 px-12 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent text-black shadow-[inset_0_0_0_2px_#616467] transition duration-200
          ${loading || selection == null 
            ? "bg-border cursor-not-allowed" 
            : "hover:scale-[120%] hover:bg-[#616467] hover:text-white"} 
          dark:text-neutral-200`}
            onClick={handleClick}>
        {loading ? <Spinner/> : "Submit"}
      </button> 
    </div>
  );
};

export default TaskPage;
