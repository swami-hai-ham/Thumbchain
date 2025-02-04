"use client";
import React, { useState } from "react";
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

const Checkbox = (props: Props) => {
  const { control, getValues, setValue } = useFormContext();
  const optionsArr = useWatch({
    control,
    name: `questions[${props.index}].options`,
    defaultValue: [], // Ensure there's an empty array if options aren't initialized
  });

  const [newOption, setNewOption] = useState("");
  const handleAddOption = () => {
    if (newOption.trim() !== "") {
      const updatedOptions = [...optionsArr, newOption.trim()];
      setValue(`questions[${props.index}].options`, updatedOptions);
      setNewOption(""); // Clear the input
    }
  };

  const handleRemoveOption = (opIndex: number) => {
    // Expected `optionsArr` to be of type `string[]`.
    const updatedOptions = optionsArr.filter(
      (_: string, i: number) => i !== opIndex
    );
    setValue(`questions[${props.index}].options`, updatedOptions);
  };

  return (
    <div className="flex-[3] h-full p-2 border-border border-[1px]">
      <div className="checkbox flex flex-col gap-3 m-4">
        <FormItem className="h-full w-full">
          <FormControl>
            <Controller
              name={`questions[${props.index}].question`}
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
          <FormItem className="h-full w-full">
            <FormControl>
              <Controller
                name={`question[${props.index}].options`}
                control={control}
                render={({ field }) => (
                  <div className="flex h-full w-full gap-2 flex-col">
                    <div className="flex h-full w-full gap-2">
                      <Input
                        value={newOption}
                        type="text"
                        placeholder="Option"
                        onChange={(e) => {
                          setNewOption(e.target.value); // Update the input's state directly
                        }}
                        className="text-foreground border-border placeholder:text-border !text-lg w-full h-full"
                      />
                      <button
                        className="active:scale-90 transition-transform duration-50 text-foreground bg-accent px-4 py-2"
                        type="button"
                        onClick={() => {
                          handleAddOption();
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {optionsArr?.map((op: string, opIndex: number) => (
                      <div className="flex items-center my-2" key={opIndex}>
                        <input
                          id={`question-${props.index}-option-${opIndex}`}
                          type="checkbox"
                          name={`question-${props.index}`}
                          defaultValue=""
                          className="w-4 h-4 focus:ring-foreground dark:focus:ring-background focus:ring-2 checked:bg-accent appearance-none border-border border-2 checked:border-0"
                        />
                        <label
                          htmlFor="default-checkbox"
                          className="ms-2 text-xl font-medium text-foreground dark:text-background flex justify-between w-full items-center"
                        >
                          {op}
                          {
                            <button
                              type="button"
                              className="p-2 active:scale-90 transition-transform duration-50"
                              onClick={() => {
                                // const currentOptions = getValues(
                                //   `question[${props.index}].options`
                                // );
                                // console.log(options);
                                // console.log(opIndex);
                                // currentOptions.splice(opIndex, 1);
                                // // console.log(currentOptions);
                                // setValue(
                                //   `question[${props.index}].options`,
                                //   currentOptions
                                // );
                                handleRemoveOption(opIndex);
                              }}
                            >
                              <img src="/delete.svg" alt="" />
                            </button>
                          }
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              />
            </FormControl>
          </FormItem>
        </div>
      </div>
    </div>
  );
};

export default Checkbox;
