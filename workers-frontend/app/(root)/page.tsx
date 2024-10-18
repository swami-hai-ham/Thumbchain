"use client"
import RetroGrid from "@/components/ui/retro-grid";
import React, { useEffect, useRef } from 'react'
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
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
    gsap.set(q('.yt'), { rotate: -30, autoAlpha: 1, x: -250, y: -250 });
    gsap.set(q('.ctr'), { rotate: 30, autoAlpha: 1, x: 300, y: -250 });
    gsap.set(q('.survey'), { rotate: -10, autoAlpha: 1, x: -100, y: -70 });
    gsap.set(q('.op'), { rotate: -25, autoAlpha: 1, x: 150, y: -50 });
    gsap.set(q('.like'), { rotate: -25, autoAlpha: 1, x: -30, y: -400 });
    gsap.set(q('.graph'), { rotate: 20, autoAlpha: 1, x: 70, y: -220 });
    gsap.set(q('.card1'), { x: -200, y: 270 });
    gsap.set(q('.card2'), { x: 0, y: 270});
    gsap.set(q('.card3'), { x: 200, y: 270});
    
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
    
    const splitText1 = new SplitType(q('.hero-title1'), { types: 'lines,words,chars' });
    const splitText2 = new SplitType(q('.hero-title2'), { types: 'lines,words,chars' });

    const chars1 = splitText1.chars; // Array of individual characters
    const chars2 = splitText2.chars; // Array of individual characters
    const midIndex1 = Math.floor(chars1!.length / 2);
    const midIndex2 = Math.floor(chars2!.length / 2);
    gsap.fromTo([q('.hero-title1')],{autoAlpha: 0}, {autoAlpha: 1, duration: 0.1})
    gsap.fromTo([q('.hero-title2')],{autoAlpha: 0}, {autoAlpha: 1, duration: 0.1})
    gsap.fromTo(chars1, 
      { autoAlpha: 0, filter: "blur(15px)"}, 
      {
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.5,
        delay: 1,
        ease: "power2.out",
        stagger: {
          each: 0.02,
          from: midIndex1, // Start the animation from the center character
        },
      });
      gsap.fromTo(chars2, 
        { autoAlpha: 0, filter: "blur(15px)"}, 
        {
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.5,
          delay: 1,
          ease: "power2.out",
          stagger: {
            each: 0.02,
            from: midIndex2, // Start the animation from the center character
          },
        });
        gsap.fromTo(q('.card'), {autoAlpha: 0, y: 300}, {autoAlpha: 1, y: 270, duration: 0.5, delay:1, stagger: 0.1})
        gsap.fromTo(q('.subText'), {autoAlpha: 0, y: 50, opacity: 0}, {autoAlpha: 1, opacity: 70, y: 0, duration: 0.5, delay: 1})
  });
  
  return (
    <div className='w-full h-screen flex justify-center items-center overflow-hidden flex-col' ref={divRef}>
      <NavBar/>
      <div className="w-30 h-32 text-primary-foreground text-7xl text-ex mt-48 z-30 flex flex-wrap hero-title1 opacity-0 font-monteserrat font-extrabold">Your Opinions</div>
      <div className="w-30 h-32 text-primary-foreground text-7xl mt-5 text-ex z-30 flex flex-wrap hero-title2 opacity-0 font-monteserrat font-extrabold">Your Earnings</div>
      <div className="w-30 h-32 text-foreground text-xl mt-10 z-30 subText opacity-0">Earn by providing real-time feedback</div>
      <div className="w-30 h-32 text-foreground text-xl z-30 subText opacity-0">on thumbnails for top creators</div>
      <div className="h-24 w-64 bg-[#292929] rounded-xl z-30 absolute hover:before:opacity-100 before:opacity-0 before:transition-opacity before:duration-300 flex justify-center items-center card1 opacity-0 card">
        <div className="text-foreground font-poppins text-xl font-medium">Web 3 Payments</div>  
        <div className="absolute bottom-2 left-0 right-0 h-16 overflow-hidden">
          <div className="dots-pattern"></div>
        </div>
      </div>
      <div className="h-24 w-64 bg-[#292929] rounded-xl z-30 absolute hover:before:opacity-100 before:opacity-0 before:transition-opacity before:duration-300 flex justify-center items-center card2 opacity-0 card">
        <div className="text-foreground font-poppins text-xl font-medium">Wallet Support</div>  
        <div className="absolute bottom-2 left-0 right-0 h-16 overflow-hidden">
          <div className="dots-pattern"></div>
        </div>
      </div>
      <div className="h-24 w-64 bg-[#292929] rounded-xl z-30 absolute hover:before:opacity-100 before:opacity-0 before:transition-opacity before:duration-300 flex justify-center items-center card3 opacity-0 card">
        <div className="text-foreground font-poppins text-xl font-medium">Easy payouts</div>  
        <div className="absolute bottom-2 left-0 right-0 h-16 overflow-hidden">
          <div className="dots-pattern"></div>
        </div>
      </div>
      <div className="w-full h-screen flex justify-center items-center overflow-hidden z-20">
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