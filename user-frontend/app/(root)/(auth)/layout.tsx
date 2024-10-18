"use client"
import SideNav from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster"
import gsap from 'gsap';
import { useGSAP } from "@gsap/react";
import { useEffect, useRef, useState } from "react";
import Link from 'next/link'

export default function RouteLayout({ children }: { children: React.ReactNode }) {
    const divRef = useRef<HTMLDivElement | null>(null);
    const [signedIn, setSignedIn] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setSignedIn(!!token);
        setIsLoading(false);
    }, []);

    useGSAP(() => {
        if (!isLoading && !signedIn) {
            const q = gsap.utils.selector(divRef);
            gsap.fromTo(q('.buttonSign'), 
                {autoAlpha: 0, scale: 0.2}, 
                {autoAlpha: 1, duration: 1, scale: 1, ease: "bounce.inOut"}
            );
        }
    }, [isLoading, signedIn]);

    if (isLoading) {
        return <div></div>; // Or a loading spinner
    }

    return (
        <div className="w-full h-full flex">
            <SideNav/>
            {signedIn && children}
            {!signedIn && (
                <div className="w-full h-screen flex justify-center items-center text-foreground border-l-2 border-border" ref={divRef}>
                    <Link href={'/'}>
                        <Button variant={"outline"} className="p-5 rounded-xl text-2xl buttonSign font-montserrat">
                            Sign in
                        </Button>
                    </Link>
                </div>
            )}
            <Toaster />
        </div>
    );
}