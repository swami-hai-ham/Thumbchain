"use client"
import React, { useRef } from 'react'
import Link from 'next/link';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import GradualSpacing from '@/components/magicui/gradual-spacing'



gsap.registerPlugin(useGSAP);

type Props = {}

const page = (props: Props) => {
  const thumbRef = useRef<HTMLDivElement | null>(null)
  useGSAP(() => {
    const q = gsap.utils.selector(thumbRef);
    gsap.fromTo([q('.link'), q('.note')], {
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
      <div className='flex flex-col justify-start items-start h-screen w-full p-5 bg-background overflow-hidden' ref={thumbRef}>
      <h1 className='font-maitree text-foreground text-3xl font-bold p-5 py-20 note'>Upload Images to find out Click-Through-Rate</h1>
      <Link href={'/thumbnail/new'} className='link font-maitree text-accent-foreground bg-accent p-5 ml-5 rounded-xl font-bold opacity-0'>Upload</Link>
      </div>
  )
}

export default page