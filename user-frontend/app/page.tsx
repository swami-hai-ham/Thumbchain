"use client"
import RetroGrid from "@/components/magicui/retro-grid";
import React, { useEffect, useRef } from 'react'
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useRecoilState } from "recoil";



gsap.registerPlugin(useGSAP);
type Props = {}

const page = (props: Props) => {
  const divRef = useRef<HTMLDivElement | null>(null)
  useGSAP(() => {
    const q = gsap.utils.selector(divRef);
    gsap.set(q('.yt'), { rotate: -30, opacity: 100, x: -200, y: -100})
    gsap.set(q('.ctr'), { rotate:30, opacity: 100, x: 250, y: -50})
    gsap.set(q('.survey'), { rotate: -10, opacity: 100, x: -100, y: 50})
    gsap.set(q('.op'), { rotate: -25, opacity: 100, x: 150, y: 70})
    gsap.set(q('.like'), { rotate: -25, opacity: 100, x: -30, y: -200})
    gsap.set(q('.graph'), { rotate: 20, opacity: 100, x: 70, y: -70})
    gsap.timeline()
        .to(divRef.current, {
          duration: 0.2,
          backgroundImage: "radial-gradient(ellipse at center, rgba(0, 255, 133, 0.2) 0%, transparent 60%)",
        })
        .from(divRef.current, {
          duration: 0.1,
          backgroundImage: "radial-gradient(ellipse at center, rgba(0, 255, 133, 0.2) 0%, transparent 60%)",
        })
        .to(divRef.current, {
          duration: 0.1,
          backgroundImage: "radial-gradient(ellipse at center, rgba(0, 255, 133, 0.2) 0%, transparent 60%)",
          repeat: 3,
          yoyo: true, // To make it blink
        })
        .to(divRef.current, {
          duration: 0.6,
          backgroundImage: "radial-gradient(ellipse at center, rgba(0, 255, 133, 0.2 ) 0%, transparent 60%)",
          delay: 0.2, // Delay before final background
        })
        .to(q('.retro'), {filter: "blur(0px)", duration: 1}, '-=1')
  })
  return (
    <div className='w-full h-screen flex justify-center items-center -z-50 overflow-hidden' ref={divRef}>
      <div className="w-full h-screen flex justify-center items-center overflow-hidden">
      <img src="/yt.svg" alt="" className='absolute h-24 w-24 yt opacity-0'/>
      <img src="/ctr.svg" alt="" className='absolute h-24 w-24 ctr opacity-0 '/>
      <img src="/survey.svg" alt="" className='absolute h-48 w-48 survey opacity-0'/>
      <img src="/opinion.svg" alt="" className='absolute h-48 w-48 op'/>
      <img src="/graph.svg" alt="" className='absolute h-36 w-36 graph'/>
      <img src="/like.svg" alt="" className='absolute h-20 w-20 like'/>
      <div className="size-full retro absolute top-0 blur-3xl -z-40" >
      <RetroGrid />
      </div>
      </div>
    </div>
  )
}

export default page