"use client";
import React, { useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import CustomConnectButton from "./CustomConnectButton";

gsap.registerPlugin(useGSAP);

const NavBar = () => {
  const [hover, setHover] = useState(false);

  const navRef = useRef<HTMLDivElement | null>(null);
  useGSAP(() => {
    const q = gsap.utils.selector(navRef.current);
    console.log([q("button"), q("a")]);

    const tl = gsap.timeline();
    tl.set(navRef.current, { opacity: 10 });
    tl.from([q("a"), q(".connect button")], {
      y: -100,
      opacity: 0,
      stagger: 0.2,
      duration: 0.5,
      delay: 1,
    });
    tl.add(() => {
      gsap.set(navRef.current, {
        borderColor: "#4D4D4D",
        borderBottom: "1px solid",
      });
    });
  });

  useGSAP(
    () => {
      const q = gsap.utils.selector(navRef);
      gsap.set(q(".rub"), { opacity: hover ? 100 : 0 });
    },
    { dependencies: [hover], scope: navRef }
  );
  return (
    <div
      className="absolute top-0 w-full h-24 flex items-center justify-between p-2 px-4 z-30 opacity-0"
      ref={navRef}
    >
      <Link
        href={"/"}
        className="font-honk text-3xl p-3 px-10 cursor-none"
        onMouseEnter={() => {
          setHover(true);
        }}
        onMouseLeave={() => setHover(false)}
      >
        Thumbchain
      </Link>
      <div className="flex items-center justify-center gap-20">
        <Link
          href={"/thumbnail"}
          className="font-montserrat text-sm font-medium text-foreground hover:text-primary"
        >
          Thumbnail
        </Link>
        <Link
          href={"/survey"}
          className="font-montserrat text-sm font-medium text-foreground hover:text-primary"
        >
          Survey
        </Link>
        <CustomConnectButton />
        <img
          src="https://media.tenor.com/3EbQTgb3eqwAAAAi/petpet-transparent.gif"
          alt=""
          className="rub opacity-0 absolute h-11 w-11 left-[30px] top-2 "
        />
      </div>
    </div>
  );
};

export default NavBar;
