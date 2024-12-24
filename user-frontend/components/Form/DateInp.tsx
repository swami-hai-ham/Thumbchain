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
import { useFormContext } from "react-hook-form";

type Props = {
    index: number
};


const DateInp = (props: Props) => {
  const [date, setDate] = React.useState<Date>();
  const { control } = useFormContext();
  return (
    <div className="Date flex flex-col gap-3 m-4">
      <Input
        type="text"
        placeholder="Question"
        className="text-foreground border-border placeholder:text-border !text-xl w-full h-full"
      />
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
            {date ? format(date, "PPP") : <span>Pick a date</span>}
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
  );
};

export default DateInp;
