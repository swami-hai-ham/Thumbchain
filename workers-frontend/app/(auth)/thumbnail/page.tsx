"use client";
import CountryDropdown from "@/components/dropdown/countries";
import Link from "next/link";
import React, {  useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ShineBorder from "@/components/ui/shine-border";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useDropdownStore } from "@/store/dropdown";
import axios from 'axios'
import { useRouter } from "next/navigation";


type Props = {};

const page = (props: Props) => {
  const { countryValue } = useDropdownStore();
  const shineBorderRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(
      shineBorderRef.current, 
      {
        delay:0.5,
        autoAlpha: 0,
        scale: 0.8, // Initial state
      },
      {
        autoAlpha: 1,
        scale: 1, // Final state
        duration: 1,
        ease: "power2.out",
      }
    ).fromTo(
      headingRef.current, 
      {
        delay:0.5,
        y: -50,
        autoAlpha: 0, // Initial state
      },
      {
        y: 0,
        autoAlpha: 1, // Final state
        duration: 1,
        ease: "power2.out",
      },
      "-=1" // Overlap with the previous animation by 0.5s
    );
  }, []);

  const handleFetchTask = async () => {
    console.log(countryValue)
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3003/v1/worker/nexttask?country=${countryValue}`,
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3JrZXJJZCI6MTIsImlhdCI6MTcyODMxNjU4NX0.a8i_sY0zWQhpbXima5uFdt5osLb_4ZCHF57v2hTO9yI",
          },
        }
      );
  
      // Redirect to the next task page
      router.push(
        `/thumbnail/nexttask?task=${encodeURIComponent(
          JSON.stringify(response.data.task)
        )}`
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Handle no tasks available (404)
        router.push("/thumbnail/tasksdone");
      } else {
        console.error("Error fetching task", error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <div className="w-full h-1/2 px-10 flex flex-col justify-center items-center text-foreground p-4">
      <ShineBorder ref={shineBorderRef} className='shine w-full flex flex-col justify-center items-center bg-background h-full text-foreground opacity-0' color={["#4B0082", "#00BFFF", "#00FF7F"]} duration={5}>
      <h1 className="font-montserrat text-5xl font-semibold mb-10" ref={headingRef}>
        Rate Thumbnails
      </h1>
      <div className="w-full md:w-1/2 lg:w-1/3 flex items-center space-x-3">
        <CountryDropdown/>
        <Button onClick={handleFetchTask} role="link" disabled={loading} className="rounded-xl z-10 hover:scale-110 transition-transform duration-100">
            {loading ? "Loading..." : "Let's Go!"}
          </Button>
      </div>
      </ShineBorder>
    </div>
  );
};

export default page;
