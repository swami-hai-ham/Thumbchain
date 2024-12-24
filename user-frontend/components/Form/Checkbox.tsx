"use client";
import React, { useState } from "react";
import { Input } from "../ui/input";
import { FormControl, FormItem } from "@/components/ui/form";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
type Props = {
  index: number;
};

const Checkbox = (props: Props) => {
  const { control, getValues, setValue } = useFormContext();
  const [options, setOptions] = useState<string[]>([]);
  const handleAddOption = (index: number) => {
    if (options[index] && options[index].length != 0) {
      const currentOptions =
        getValues(`question[${props.index}].options`) || [];
      setValue(`question[${props.index}].options`, [
        ...currentOptions,
        options[index],
      ]);
      let updatedOptions = [...options];
      updatedOptions[index] = ""; // Clear input after adding
      setOptions(updatedOptions);
      console.log(getValues(`question[${props.index}].options`));
      console.log(options);
    }
  };
  return (
    <div className="flex-[3] h-full p-2 border-border border-[1px]">
      <div className="checkbox flex flex-col gap-3 m-4">
        <FormItem className="h-full w-full">
          <FormControl>
          <Controller
              name={`question[${props.index}].question`}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  placeholder="Question"
                  className="text-foreground border-border placeholder:text-border !text-xl w-full h-full"
                />
              )}
            />
          </FormControl>
        </FormItem>
        <div className="flex justify-center items-center m-5 gap-2">
          <Input
            type="text"
            placeholder="Option"
            className="text-foreground border-border placeholder:text-border !text-lg w-full h-full"
          />
          <button className="active:scale-90 transition-transform duration-50 text-foreground bg-accent px-4 py-2">
            Add
          </button>
        </div>
        <div className="flex items-center mx-10">
          <input
            id="default-checkbox"
            type="checkbox"
            defaultValue=""
            className="w-4 h-4 focus:ring-foreground dark:focus:ring-background focus:ring-2 checked:bg-accent appearance-none border-border border-2 checked:border-0"
          />
          <label
            htmlFor="default-checkbox"
            className="ms-2 text-lg font-medium text-foreground dark:text-background"
          >
            Sample checkbox
          </label>
        </div>
      </div>
    </div>
  );
};

export default Checkbox;
