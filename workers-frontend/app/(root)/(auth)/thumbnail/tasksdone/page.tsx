"use client";
import Link from "next/link";
import React, { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const Page = () => {
  const doneRef = useRef<HTMLDivElement | null>(null);
  useGSAP(() => {
    const q = gsap.utils.selector(doneRef);
    gsap.fromTo(
      [q("h1"), q("img"), q("div")],
      { autoAlpha: 0, y: -50 },
      { autoAlpha: 1, y: 0, stagger: 0.2, duration: 1, ease: "power2.out" }
    );
  });

  return (
    <div
      className="flex flex-col items-center p-6 text-foreground overflow-hidden gap-20"
      ref={doneRef}
    >
      <h1 className="text-2xl font-bold opacity-0">All tasks are done!</h1>
      <img
        src="https://media.tenor.com/fYg91qBpDdgAAAAi/bongo-cat-transparent.gif"
        alt=""
        className="opacity-0"
      />
      <div className="flex flex-col items-center gap-20 opacity-0">
        <p className="text-md mt-4 rounded-xl bg-border p-4">
          Tip: If you applied a country filter, try removing it to access more
          tasks!
        </p>
        <Link
          href={"/thumbnail"}
          className="p-4 text-foreground bg-primary text-md rounded-xl hover:scale-110 transition-transform duration-100"
        >
          {" "}
          {"< Back"}
        </Link>
      </div>
    </div>
  );
};

export default Page;
