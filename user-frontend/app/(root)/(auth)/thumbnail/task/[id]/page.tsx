"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import BarChart from '@/components/Chart';
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link';

interface Response {
    id: number;
    image_url: string;
    task_id: number;
    _count: {
      submissions: number;
    };
}

interface Data {
    counts: number[];
    urls: string[];
}

const Page = () => {
  const params = useParams();
  const [chartData, setChartData] = useState<Data>({ counts: [], urls: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast()

  // Function to get data and update state
  const getData = async () => {
    try {
      const response = await axios.get<Response[]>(`http://localhost:3003/v1/user/task/${params.id}`, {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcyNTc4OTc2NH0.yotBb3d7q8bkSz-Ztdi0K3hg4fdBXwQbR3i6IZVowCc`
        }
      });

      const data = response.data;

      // Create arrays for counts and urls
      const counts = data.map(value => value._count.submissions);
      const urls = data.map(value => value.image_url);

      // Update state with chart data
      setChartData({ counts, urls });
    } catch (e:any) {
        toast({
            title: e.code,
            variant: "destructive",
            description: "Internal server error",
            className: "bg-red-500 rounded-xl text-xl"
          })
    }
  };

  // Independent delay of 0.7 seconds before showing the chart
  useEffect(() => {
    // Set loading to false after 0.7 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);

    // Fetch data immediately
    getData();

    // Cleanup the timer
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='w-full border-border border-l-2 h-screen flex justify-start items-center flex-col'>
      <div className='flex justify-between items-center w-full h-1/6'>
        <Link href='/thumbnail' className='text-foreground text-xl hover:scale-110 transition-all duration-200 font-poppins m-10 p-5 rounded-xl bg-border'>
          {"<  Back"}
        </Link>
        <button 
          onClick={getData} // Retry on click
          className="bg-background flex justify-center items-center hover:scale-110 transition-all duration-200 text-foreground text-lg gap-2 m-10 p-5 rounded-xl"
        >
          Retry
          <svg xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-3000 ease-in-out transform hover:rotate-[360deg] group" viewBox="0 0 24 24" width="16" height="16" fill="rgba(77,77,77,1)">
            <path d="M12 4C14.5905 4 16.8939 5.23053 18.3573 7.14274L16 9.5H22V3.5L19.7814 5.71863C17.9494 3.452 15.1444 2 12 2 6.47715 2 2 6.47715 2 12H4C4 7.58172 7.58172 4 12 4ZM20 12C20 16.4183 16.4183 20 12 20 9.40951 20 7.10605 18.7695 5.64274 16.8573L8 14.5 2 14.5V20.5L4.21863 18.2814C6.05062 20.548 8.85557 22 12 22 17.5228 22 22 17.5228 22 12H20Z"></path>
          </svg>
        </button>
      </div>

      {/* Show Spinner for 0.7 seconds */}
      {loading ? (
        <div className='flex space-x-2 justify-center items-center bg-background absolute top-2/4'>
          <div className='h-8 w-8 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]'></div>
          <div className='h-8 w-8 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]'></div>
          <div className='h-8 w-8 bg-foreground rounded-full animate-bounce'></div>
        </div>
      ) : (
        <BarChart data={chartData.counts} url={chartData.urls} labels={["Image 1", "Image 2", "Image 3", "Image 4", "Image 5"]} />
      )}
    </div>
  );
};

export default Page;
