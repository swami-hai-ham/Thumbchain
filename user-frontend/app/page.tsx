"use client"
import RetroGrid from "@/components/magicui/retro-grid";
import React, { useEffect, useRef } from 'react'
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useRecoilState } from "recoil";
import NavBar from "@/components/NavBar";
import SplitType from "split-type";


gsap.registerPlugin(useGSAP);
type Props = {}

const page = (props: Props) => {
  const divRef = useRef<HTMLDivElement | null>(null)
  const timeline = gsap.timeline()
  useGSAP(() => {
    const q = gsap.utils.selector(divRef);
    
    // Set initial states using autoAlpha
    gsap.set(q('.yt'), { rotate: -30, autoAlpha: 1, x: -200, y: -200 });
    gsap.set(q('.ctr'), { rotate: 30, autoAlpha: 1, x: 250, y: -150 });
    gsap.set(q('.survey'), { rotate: -10, autoAlpha: 1, x: -100, y: -50 });
    gsap.set(q('.op'), { rotate: -25, autoAlpha: 1, x: 150, y: -30 });
    gsap.set(q('.like'), { rotate: -25, autoAlpha: 1, x: -30, y: -300 });
    gsap.set(q('.graph'), { rotate: 20, autoAlpha: 1, x: 70, y: -170 });
    
    timeline
      .to(divRef.current, {
        duration: 0.4,
        backgroundImage: "radial-gradient(ellipse at center, rgba(0, 255, 133, 0.3) 0%, transparent 60%)",
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
      .to(q('.retro'), { filter: "blur(0px)", duration: 1, autoAlpha: 1 }, '-=1');
    
    const splitText = new SplitType(q('.hero-title'), { types: 'lines,words,chars' });

    const chars = splitText.chars; // Array of individual characters
    const midIndex = Math.floor(chars!.length / 2);
    console.log(chars) // Keep only non-space characters
    gsap.fromTo([q('.hero-title')],{autoAlpha: 0}, {autoAlpha: 1, duration: 0.1})
    gsap.fromTo(chars, 
      { autoAlpha: 0, filter: "blur(15px)"}, 
      {
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.3,
        delay: 1,
        ease: "power2.out",
        stagger: {
          each: 0.02,
          from: midIndex, // Start the animation from the center character
        },
      });
  });
  
  return (
    <div className='w-full h-screen flex justify-center items-center overflow-hidden flex-col' ref={divRef}>
      <NavBar tl={timeline}/>
      <div className="w-30 h-32 text-foreground text-6xl text-ex mt-60 z-30 flex flex-wrap hero-title opacity-0">Are hasenge log, kahenge LOL XD</div>
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