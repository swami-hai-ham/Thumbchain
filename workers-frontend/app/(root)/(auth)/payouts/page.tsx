"use client"
import React, { useEffect, useState } from 'react'
import { columns, Payouts } from './columns'
import { DataTable } from './data-table'
import axios from 'axios'
import { useToast } from '@/hooks/use-toast'
type Props = {}
type PayData = {
  id: number;
  worker_id: number;
  amount: number;
  signature: string;
}


const page = (props: Props) => {
  const BACKEND_LINK = process.env.NEXT_PUBLIC_BACKEND_LINK;
  const { toast } = useToast();
  const [data, setData] = useState<Payouts[]>();
  const [loading, setLoading] = useState(true);
  const getData = async () => {
    try {
      const response = await axios.get(`${BACKEND_LINK}/v1/worker/payout/bulk`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.data.msg) {
        setData([]); // Set data to empty array to indicate no payouts
        return;
      }
      console.log(String(response.data.payoutTableData[0].signature));
      const data: PayData[] = await response.data.payoutTableData;
      const result: Payouts[] = data.map((pay: Payouts) => ({
        amount: pay.amount,
        signature: pay.signature.toString()
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
  return (
    <div className="w-full h-full px-10 flex flex-col justify-center items-center text-foreground p-4">
      {loading ? (
        <div className="flex space-x-2 justify-center items-center bg-background absolute top-2/4">
          <div className="h-8 w-8 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-8 w-8 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-8 w-8 bg-foreground rounded-full animate-bounce"></div>
        </div>
      ) : (
        data && <DataTable columns={columns} data={data} />
      )}
    </div>
  )
}

export default page