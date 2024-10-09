"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import React, {useState} from "react";
import axios from "axios";
import Spinner from "@/components/Spinner";
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
  const searchParams = useSearchParams(); 
  const taskData = searchParams.get("task"); 
  
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<number | null>(null);
  const router = useRouter();
  const { countryValue } = useDropdownStore();

  let task: Task;
  try {
    task = taskData ? JSON.parse(taskData) : null;
  } catch (error) {
    console.error("Error parsing task data:", error);
    task = null; 
  }

  const handleClick = async () => {
    setLoading(true);
    try {
        const body = {
            taskId: `${task?.id}`,
            selection: `${selection}`,
        };

        const response = await axios.post(
            `http://localhost:3003/v1/worker/submission?country=${countryValue}`,
            body,
            {
                headers: {
                    Authorization:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3JrZXJJZCI6MSwiaWF0IjoxNzI4NDc3OTM3fQ.DwzqnLk-hshw_FL9ZzhMV59mv_2969PJv-B0zibJ5To",
                },
            }
        );

        if (response.status === 200) {
            if (response.data.nextTask) {
                router.push(
                    `/thumbnail/nexttask?task=${encodeURIComponent(
                        JSON.stringify(response.data.nextTask)
                    )}`
                );
            } else {
                router.push("/thumbnail/tasksdone");
            }
        }
    } catch (error) {
        console.error("Error submitting task", error);
    } finally {
        setLoading(false);
    }
  };

  // Split task options into two rows if more than 5
  // Check if options are more than 5
  const shouldSplit = task?.options.length? task?.options.length > 4 : false;

  const firstRowOptions = shouldSplit
    ? task?.options.slice(0, Math.ceil(task.options.length / 2))
    : task?.options;

  const secondRowOptions = shouldSplit
    ? task?.options.slice(Math.ceil(task.options.length / 2))
    : [];


  return (
    <div className="flex flex-col items-center p-6 h-screen w-full text-foreground">
      <h1 className="text-4xl font-bold font-montserrat my-10">{task?.title}</h1>
      
      {/* First row of options */}
      <div className="flex justify-between items-center gap-10 w-full mx-5 px-20 my-6">
        {firstRowOptions?.map((option: ThumbnailOption) => (
          <div key={option.id} className="relative images">
            <img
              src={option.image_url}
              style={{
                width: "auto",
                height: "150px",
              }}
              className={`shadow-md object-contain rounded-lg transition-transform duration-200 group-hover:scale-105 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,123,255,0.6)] ${selection === option.id ? "border-2 border-accent transition-all" : ""}`}
              alt={`Option ${option.id}`}
              onClick={() => setSelection(option.id !== selection ? option.id : null)}
            />
          </div>
        ))}
      </div>

      {/* Second row of options */}
      {secondRowOptions && secondRowOptions.length > 0 && (
        <div className="flex justify-between items-center gap-10 w-full mx-5 px-20 my-6">
          {secondRowOptions?.map((option: ThumbnailOption) => (
            <div key={option.id} className="relative images">
              <img
                src={option.image_url}
                style={{
                  width: "auto",
                  height: "150px",
                }}
                className={`shadow-md object-contain rounded-lg transition-transform duration-200 group-hover:scale-105 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,123,255,0.6)] ${selection === option.id ? "border-2 border-accent transition-all" : ""}`}
                alt={`Option ${option.id}`}
                onClick={() => setSelection(option.id !== selection ? option.id : null)}
              />
            </div>
          ))}
        </div>
      )}

      <button
        disabled={loading || selection == null}
        className={`submit font-poppins text-foreground m-20 px-12 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent text-black shadow-[inset_0_0_0_2px_#616467] transition duration-200
          ${loading || selection == null
            ? "bg-border cursor-not-allowed"
            : "hover:scale-[120%] hover:bg-[#616467] hover:text-white"}
          dark:text-neutral-200`}
        onClick={handleClick}
      >
        {loading ? <Spinner /> : "Submit"}
      </button>
    </div>
  );
};

export default TaskPage;
