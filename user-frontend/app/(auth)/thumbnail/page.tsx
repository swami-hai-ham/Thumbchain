"use client"
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import GradualSpacing from '@/components/magicui/gradual-spacing'
import ShineBorder from '@/components/magicui/shine-border';
import { DataTable } from './data-table';
import { Payment, columns } from "./columns"
import { useRouter } from "next/navigation";
import axios from 'axios';
import { useToast } from "@/hooks/use-toast"

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
}




gsap.registerPlugin(useGSAP);

type Props = {}

const page = (props: Props) => {
  const thumbRef = useRef<HTMLDivElement | null>(null)
  const [data, setData] = useState<Payment[]>()
  const [loading, setLoading] = useState(true);
  const { toast } = useToast()
  const router = useRouter();
  const getData = async () => {
    try{const response = await axios.get('http://localhost:3003/v1/user/task/bulk', {
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcyNTc4OTc2NH0.yotBb3d7q8bkSz-Ztdi0K3hg4fdBXwQbR3i6IZVowCc`
        }
    });
    console.log(response)
    const data: TaskType[] = await response.data;
    const result: Payment[] = data.map((task: TaskType) => ({
        id: task.id,
        title: task.title,
        status: task.done ? "Done" : "Pending",
        amount: task.amount,
        result: `http://localhost:3000/thumbnail/task/${task.id}`
    }));
    setData(result)}catch(e:any){
      toast({
        title: e.code,
        variant: "destructive",
        description: "Internal server error",
        className: "bg-red-500 rounded-xl text-xl"
      })
    }
  }
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
    gsap.fromTo([q('.shine')], {
      y: -50,
      autoAlpha: 0,
    }, {
      autoAlpha: 1,
      y:0,
      delay: 0.5,
      duration: 1
    })
  })
  
  

  return (
      <div className='flex justify-start flex-col gap-10 items-center h-full min-h-screen w-full p-5 bg-background border-border border-l-2 overflow-visible' ref={thumbRef}>
      <ShineBorder className='shine w-full flex justify-center items-center bg-background h-32 opacity-0' color={["#4B0082", "#00BFFF", "#00FF7F"]} duration={5}>
      <h1 className='font-maitree text-foreground text-3xl font-bold p-5 py-20 note'>Upload Thumbnails to find out Click-Through-Rate</h1>
      <Link href={'/thumbnail/new'} className='z-10 link font-maitree text-accent-foreground bg-primary p-5 ml-5 rounded-xl font-bold'>Upload</Link>
      </ShineBorder>
      {loading ? (
        <div className='flex space-x-2 justify-center items-center bg-background absolute top-2/4'>
          <div className='h-8 w-8 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]'></div>
          <div className='h-8 w-8 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]'></div>
          <div className='h-8 w-8 bg-foreground rounded-full animate-bounce'></div>
        </div>
      ) : (
        data && <DataTable columns={columns} data={data}/>
      )}
      </div>
  )
}

export default page