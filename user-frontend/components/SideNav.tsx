"use client"
import React, { useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
type Props = {}

const SideNav = (props: Props) => {
    const navRef = useRef<HTMLDivElement | null>(null)
    useGSAP(() => {
        const q = gsap.utils.selector(navRef.current);
        gsap.fromTo([q('.sideNavLink')], {autoAlpha: 0, x: -100}, {x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.2})
    },
    {scope: navRef})
    return (
        <div className='h-screen w-1/4 flex justify-center items-start flex-col gap-12 ml-28' ref={navRef}>
            <Link href={'/'} className='flex justify-center items-center gap-6 sideNavLink opacity-0'>
            <img src="/home-line.svg" alt="" />
            <span className='text-foreground font-poppins text-xl'>Home</span>
            </Link>
            <Link href={'/thumbnail'} className='flex justify-center items-center gap-6 sideNavLink opacity-0'>
            <img src="/youtube-fill.svg" alt="" />
            <span className='text-foreground font-poppins text-xl'>Thumbnail</span>
            </Link>
            <Link href={'/tasks'} className='flex justify-center items-center gap-6 sideNavLink opacity-0'>
            <img src="/check-fill.svg" alt="" />
            <span className='text-foreground font-poppins text-xl'>Tasks</span>
            </Link>
        </div>
    )
}

export default SideNav