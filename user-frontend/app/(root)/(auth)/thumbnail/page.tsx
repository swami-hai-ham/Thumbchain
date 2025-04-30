"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import ShineBorder from "@/components/magicui/shine-border";
import { DataTable } from "./data-table";
import { Payment, columns } from "./columns";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface CountType {
  submissions: number;
}

interface OptionType {
  id: number;
  image_url: string;
  task_id: number;
  _count: CountType;
}

interface TaskType {
  id: number;
  title: string;
  user_id: number;
  signature: string;
  done: boolean;
  amount: number;
  options: OptionType[];
  country: string;
}

gsap.registerPlugin(useGSAP);

type Props = {};

const Page = (props: Props) => {
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<Payment[]>();
  const BACKEND_LINK = process.env.NEXT_PUBLIC_BACKEND_LINK;
  const FRONTEND_LINK = process.env.NEXT_PUBLIC_FRONTEND_LINK;
  const WORKER_FRONTEND_LINK = process.env.NEXT_PUBLIC_WORKER_FRONTEND_LINK;
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const getData = async () => {
    try {
      const response = await axios.get(`${BACKEND_LINK}/v1/user/task/bulk`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log(response);
      const data: TaskType[] = await response.data;
      const result: Payment[] = data.map((task: TaskType) => ({
        id: task.id,
        title: task.title,
        status: task.done ? "Done" : "Pending",
        amount: task.amount,
        result: `${FRONTEND_LINK}/thumbnail/task/${task.id}`,
        country: task.country
          ? task.country.charAt(0).toUpperCase() +
            task.country.slice(1).toLowerCase()
          : "None",
        redirectURL: `${WORKER_FRONTEND_LINK}/thumbnail/gettask?task=${encodeURIComponent(
          JSON.stringify(task)
        )}`,
      }));
      setData(result);
      console.log(result);
    } catch (e: any) {
      toast({
        title: e.code,
        variant: "destructive",
        description: "Internal server error",
        className: "bg-red-500 rounded-xl text-xl",
      });
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Fetch data immediately
    getData();

    // Cleanup the timer
    return () => clearTimeout(timer);
  }, []);
  useGSAP(() => {
    const q = gsap.utils.selector(thumbRef);
    gsap.fromTo(
      [q(".shine")],
      {
        y: -50,
        autoAlpha: 0,
      },
      {
        autoAlpha: 1,
        y: 0,
        delay: 0.5,
        duration: 1,
      }
    );
  });

  return (
    <div
      className="flex justify-start flex-col gap-10 items-center h-full min-h-screen w-full p-5 bg-background border-border border-l-2 overflow-visible"
      ref={thumbRef}
    >
      <ShineBorder
        className="shine w-full flex justify-center items-center bg-background h-24 opacity-0"
        color={["#4B0082", "#00BFFF", "#00FF7F"]}
        duration={5}
      >
        <h1 className="font-maitree text-foreground text-xl font-bold p-5 py-20 note">
          Upload Thumbnails to find out Click-Through-Rate
        </h1>
        <Link
          href={"/thumbnail/new"}
          className="z-10 link font-maitree text-accent-foreground bg-primary p-5 ml-5 rounded-xl font-bold text-sm"
        >
          Upload
        </Link>
      </ShineBorder>
      {loading ? (
        <div className="flex space-x-2 justify-center items-center bg-background absolute top-2/4">
          <div className="h-4 w-4 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-4 w-4 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-4 w-4 bg-foreground rounded-full animate-bounce"></div>
        </div>
      ) : (
        data && <DataTable columns={columns} data={data} />
      )}
    </div>
  );
};

export default Page;
