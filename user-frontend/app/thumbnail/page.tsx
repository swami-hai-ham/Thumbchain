"use client"
import React, { useRef } from 'react'
import Link from 'next/link';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";



gsap.registerPlugin(useGSAP);

type Props = {}

const page = (props: Props) => {
  const thumbRef = useRef<HTMLDivElement | null>(null)
  useGSAP(() => {
    const q = gsap.utils.selector(thumbRef);
    gsap.from([q('h1'), q('a')], {
      y: -50,
      opacity: 0,
      stagger: 0.2,
      duration: 0.5
    })
  })

  return (
    <div className='flex flex-col justify-start items-center h-screen w-full p-5 overflow-hidden bg-background' ref={thumbRef}>
      <h1 className='font-maitree text-foreground text-3xl font-bold p-5 py-20'>Upload Images to find out Click-Through-Rate</h1>
      <Link href={'/thumbnail/new'} className='font-maitree text-accent-foreground bg-accent p-5 rounded-xl font-bold'>Upload</Link>
    </div>
  )
}

export default page