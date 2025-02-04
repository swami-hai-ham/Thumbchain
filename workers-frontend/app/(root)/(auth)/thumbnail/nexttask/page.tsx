"use client";
import { useSearchParams, useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import React, { useRef, useState } from "react";
import axios from "axios";
import Spinner from "@/components/Spinner";
import { useDropdownStore, usePendingAmt } from "@/store/dropdown";
import { useToast } from "@/hooks/use-toast";
import ReCAPTCHA from "react-google-recaptcha";

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
  const divRef = useRef<HTMLDivElement | null>(null);
  const { setAmount } = usePendingAmt();
  const taskData = searchParams.get("task");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<number | null>(null);
  const router = useRouter();
  const { countryValue } = useDropdownStore();
  const RECAPTCHA_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_KEY;
  const BACKEND_LINK = process.env.NEXT_PUBLIC_BACKEND_LINK;
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  let task: Task;
  try {
    task = taskData ? JSON.parse(taskData) : null;
  } catch (error) {
    console.error("Error parsing task data:", error);
    task = null;
  }

  const handleClick = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const retoken = await recaptchaRef.current?.executeAsync();
    recaptchaRef.current?.reset();

    if (!retoken) {
      console.log("Captcha validation failed.");
      return;
    }

    const response = await axios.post("/api/verify-recaptcha", {
      token: retoken,
    });

    if (response.status == 200) {
      console.log("Captcha verified");
    } else {
      console.log("Captcha verification failed. Please try again.");
      return;
    }
    try {
      const body = {
        taskId: `${task?.id}`,
        selection: `${selection}`,
      };

      const response = await axios.post(
        `${BACKEND_LINK}/v1/worker/submission?country=${countryValue}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        if (response.data.nextTask) {
          const responsepay = await axios.get(
            `${BACKEND_LINK}/v1/worker/balance`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setAmount(Number(responsepay.data.pendingAmount));
          router.push(
            `/thumbnail/nexttask?task=${encodeURIComponent(
              JSON.stringify(response.data.nextTask)
            )}`
          );
        } else {
          const responsepay = await axios.get(
            `${BACKEND_LINK}/v1/worker/balance`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setAmount(Number(responsepay.data.pendingAmount));
          router.push("/thumbnail/tasksdone");
        }
      }
    } catch (e) {
      toast({
        title: "Submission Error",
        variant: "destructive",
        duration: 2000,
        description: "Make sure you've not submited already",
        className: "bg-red-500 rounded-xl text-xl",
      });
      console.error("Error submitting task", e);
    } finally {
      setLoading(false);
    }
  };

  const shouldSplit = task?.options.length ? task?.options.length > 4 : false;

  const firstRowOptions = shouldSplit
    ? task?.options.slice(0, Math.ceil(task.options.length / 2))
    : task?.options;

  const secondRowOptions = shouldSplit
    ? task?.options.slice(Math.ceil(task.options.length / 2))
    : [];

  // const didAnimate = useRef(false);

  useGSAP(() => {
    const q = gsap.utils.selector(divRef);
    gsap.fromTo(
      q(".title"),
      { autoAlpha: 0, y: -100 },
      { autoAlpha: 1, y: 0, duration: 1, scale: 1, ease: "bounce.inOut" }
    );
    gsap.fromTo(
      q(".images"),
      { autoAlpha: 0, scale: 0.5, rotate: -20 },
      {
        autoAlpha: 1,
        scale: 1,
        stagger: 0.2,
        duration: 0.5,
        rotate: 0,
        ease: "power2.out",
      }
    );
    gsap.fromTo(
      q(".submit"),
      { autoAlpha: 0, scale: 0.2 },
      { autoAlpha: 1, scale: 1.2, duration: 0.5, ease: "power2.out" }
    );
  }, [task?.title]);

  return (
    <div
      className="flex flex-col items-center p-6 h-screen w-full text-foreground"
      ref={divRef}
    >
      <h1 className="text-4xl font-bold font-montserrat my-10 title opacity-0">
        {task?.title}
      </h1>

      {/* First row of options */}
      <div className="flex justify-between items-center gap-10 w-full mx-5 px-20 my-6">
        {firstRowOptions?.map((option: ThumbnailOption) => (
          <div key={option.id} className="relative images images opacity-0">
            <img
              src={option.image_url}
              style={{
                width: "auto",
                height: "150px",
              }}
              className={`shadow-md object-contain rounded-lg transition-transform duration-200 group-hover:scale-105 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,123,255,0.6)] ${
                selection === option.id
                  ? "border-2 border-accent transition-all"
                  : ""
              }`}
              alt={`Option ${option.id}`}
              onClick={() =>
                setSelection(option.id !== selection ? option.id : null)
              }
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
                className={`shadow-md object-contain rounded-lg transition-transform duration-200 group-hover:scale-105 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,123,255,0.6)] ${
                  selection === option.id
                    ? "border-2 border-accent transition-all"
                    : ""
                }`}
                alt={`Option ${option.id}`}
                onClick={() =>
                  setSelection(option.id !== selection ? option.id : null)
                }
              />
            </div>
          ))}
        </div>
      )}
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={RECAPTCHA_KEY!}
        size="invisible"
        badge="bottomright"
      />
      <button
        disabled={loading || selection == null}
        className={`submit opacity-0 font-poppins text-foreground m-20 px-12 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent text-black shadow-[inset_0_0_0_2px_#616467] transition duration-200
          ${
            loading || selection == null
              ? "bg-border cursor-not-allowed"
              : "hover:scale-[120%] hover:bg-[#616467] hover:text-white"
          }
          dark:text-neutral-200`}
        onClick={handleClick}
      >
        {loading ? <Spinner /> : "Submit"}
      </button>
    </div>
  );
};

export default TaskPage;
