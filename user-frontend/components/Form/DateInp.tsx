import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "../ui/input";
import { Controller, useFormContext } from "react-hook-form";
import { FormControl, FormItem } from "../ui/form";

type Props = {
  index: number;
};

const DateInp = (props: Props) => {
  const [date, setDate] = React.useState<Date>();
  return (
    <div className="flex-[3] h-full p-2 border-border border-[1px]">
      <div className="checkbox flex flex-col gap-3 m-4">
        <div className="Date flex flex-col gap-3 m-4">
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left !p-6 rounded-xl flex items-center gap-2",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="w-[20px] h-[20px]" />
                {date ? (
                  format(date, "PPP")
                ) : (
                  <span className="text-sm">Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className=" w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                fromYear={1960}
                onSelect={setDate}
                toYear={2050}
                captionLayout="dropdown-buttons"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default DateInp;
