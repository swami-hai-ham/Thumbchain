import React, { useState } from "react";
import Multichoice from "@/components/Form/Multichoice";
import Checkbox from "@/components/Form/Checkbox";
import Uinp from "@/components/Form/Uinp";
import DateInp from "@/components/Form/DateInp";
//tooltip
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFieldArray, useFormContext } from "react-hook-form";

type Props = {
  type: string;
  index: number;
};

const QuestionContainer = ({ type, index }: Props) => {
  const { control, getValues, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "questions",
  });
  const [selectedType, setSelectedType] = useState<string>(type);
  // const handleTypeChange = (newType: string) => {
  //   setSelectedType(newType);

  //   // Remove the current item at the specified index
  //   remove(index);

  //   // Append a new item with the new type
  //   append({
  //     type: newType,
  //     question: "",
  //     options: newType === "multichoice" || newType === "checkbox" ? [] : undefined,
  //     description: newType === "user_input" ? "" : undefined,
  //   });
  // };
  const handleTypeChange = (newType: string) => {
    const currentQuestion = getValues(`questions[${index}]`);
    setValue(`questions[${index}]`, {
      ...currentQuestion,
      type: newType,
      options:
        newType === "user_input" || newType === "date"
          ? undefined
          : currentQuestion.options,
      description:
        newType === "user_input" || newType === "date"
          ? currentQuestion.description
          : undefined,
    });
    setSelectedType(newType);
  };

  const renderQuestionComponent = () => {
    switch (selectedType) {
      case "multichoice":
        return <Multichoice index={index} />;
      case "checkbox":
        return <Checkbox index={index} />;
      case "user_input":
        return <Uinp index={index} />;
      case "date":
        return <DateInp index={index} />;
      default:
        return null;
    }
  };
  return (
    <div className="w-full h-full p-8 flex justify-center items-center text-foreground border-border border-2 gap-4">
      {renderQuestionComponent()}
      <div className="flex-[1] h-full border-border border-[1px] flex flex-col justify-center items-center">
        <div className="flex justify-around items-center border-b-[1px] h-full w-full border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="p-2 active:scale-90 transition-transform duration-50 py-5"
                onClick={() => {
                  append({
                    type: "multichoice",
                    question: "",
                    options: [],
                  });
                  setTimeout(() => {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    });
                  }, 0);
                }}
              >
                <img src="/plus.svg" alt="" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New Question</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="p-2 active:scale-90 transition-transform duration-50 py-5"
                onClick={() => {
                  const currentQuestion = getValues(`questions[${index}]`);
                  append({
                    ...currentQuestion,
                  });
                  setTimeout(() => {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    });
                  }, 0);
                }}
              >
                <img src="/duplicate.svg" alt="" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Duplicate</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="p-2 active:scale-90 transition-transform duration-50 py-5"
                onClick={() => {
                  remove(index);
                }}
              >
                <img src="/delete.svg" alt="" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex justify-around flex-col items-start border-b-[1px] h-full w-full border-border">
          <div className="flex items-center my-8 mx-10">
            <input
              id={`radio-multichoice-${index}`}
              type="radio"
              name={`default-radio-${index}`}
              value="multichoice"
              checked={selectedType === "multichoice"}
              onChange={() => handleTypeChange("multichoice")}
              className="w-4 h-4 rounded-full border border-foreground appearance-none checked:bg-accent checked:border-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <label
              htmlFor={`radio-multichoice-${index}`}
              className="ms-2 text-xl font-medium text-foreground dark:text-background"
            >
              Multiple choice
            </label>
          </div>
          <div className="flex items-center my-8 mx-10">
            <input
              id={`radio-checkbox-${index}`}
              type="radio"
              name={`default-radio-${index}`}
              value="checkbox"
              checked={selectedType === "checkbox"}
              onChange={() => handleTypeChange("checkbox")}
              className="w-4 h-4 rounded-full border border-foreground appearance-none checked:bg-accent checked:border-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <label
              htmlFor={`radio-checkbox-${index}`}
              className="ms-2 text-xl font-medium text-foreground dark:text-background"
            >
              Checkbox
            </label>
          </div>
          <div className="flex items-center my-8 mx-10">
            <input
              id={`radio-user_input-${index}`}
              type="radio"
              name={`default-radio-${index}`}
              value="user_input"
              checked={selectedType === "user_input"}
              onChange={() => handleTypeChange("user_input")}
              className="w-4 h-4 rounded-full border border-foreground appearance-none checked:bg-accent checked:border-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <label
              htmlFor={`radio-user_input-${index}`}
              className="ms-2 text-xl font-medium text-foreground dark:text-background"
            >
              User Input
            </label>
          </div>
          <div className="flex items-center my-8 mx-10">
            <input
              id={`radio-date-${index}`}
              type="radio"
              name={`default-radio-${index}`}
              value="date"
              checked={selectedType === "date"}
              onChange={() => handleTypeChange("date")}
              className="w-4 h-4 rounded-full border border-foreground appearance-none checked:bg-accent checked:border-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <label
              htmlFor={`radio-date-${index}`}
              className="ms-2 text-xl font-medium text-foreground dark:text-background"
            >
              Date
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionContainer;
