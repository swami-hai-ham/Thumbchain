import React from "react";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { useFormContext } from "react-hook-form";

type Props = {
    index: number
};


const Uinp = (props: Props) => {
  const { control } = useFormContext();
  return (
    <div className="Uinp flex flex-col gap-3 m-4">
      <Input
        type="text"
        placeholder="Question"
        className="text-foreground border-border placeholder:text-border !text-xl w-full h-full"
      />
      <Textarea
        placeholder="Sample Description"
        className="text-foreground border-border placeholder:text-border !text-xl w-full h-full"
      />
    </div>
  );
};

export default Uinp;
