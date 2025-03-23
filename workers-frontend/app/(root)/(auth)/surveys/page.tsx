import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <Link
        href={"/surveys/response"}
        className="p-4 font-poppins text-foreground bg-primary rounded-xl"
      >
        Start Survey
      </Link>
    </div>
  );
};

export default page;
