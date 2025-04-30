"use client";
import React from "react";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { FormControl, FormItem } from "@/components/ui/form";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
type Props = {
  index: number;
};

const Uinp = (props: Props) => {
  return (
    <div className="flex-[3] h-full p-2 border-border border-[1px]">
      <div className="checkbox flex flex-col gap-3 m-4">
        <div className="Uinp flex flex-col gap-3 m-4">
          <FormItem className="h-full w-full">
            <FormControl>
              <Controller
                name={`questions[${props.index}].question`}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="Question"
                    className="text-foreground border-border placeholder:text-border text-md w-full h-full p-2"
                  />
                )}
              />
            </FormControl>
          </FormItem>
          <FormItem className="h-full w-full">
            <FormControl>
              <Controller
                name={`questions[${props.index}].description`}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Sample Description"
                    className="text-foreground border-border placeholder:text-border text-md w-full h-full"
                  />
                )}
              />
            </FormControl>
          </FormItem>
        </div>
      </div>
    </div>
  );
};

export default Uinp;
