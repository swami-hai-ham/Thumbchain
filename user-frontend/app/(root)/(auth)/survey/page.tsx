"use client";
import React from "react";
// shadcn
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Form
import { SurveyFormSchema } from "@/zod/formSchema";
import z from "zod";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormItem } from "@/components/ui/form";
import QuestionContainer from "@/components/Form/QuestionContainer";

type Props = {};
type FormData = z.infer<typeof SurveyFormSchema>;

const page = (props: Props) => {
  const methods = useForm<FormData>({
    resolver: zodResolver(SurveyFormSchema),
    mode: "onChange",
    delayError: 1000,
  });
  // const {
  //   control,
  //   formState: { errors },
  //   trigger,
  //   setValue,
  //   clearErrors,
  //   getValues,
  // } = useFormContext<FormData>();
  const { watch } = methods;
  const questions = watch("questions") || [];

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "questions",
  });

  return (
    <div className="w-full h-full">
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex justify-start flex-col gap-10 items-center h-full min-h-screen w-full bg-background border-border border-l-2 overflow-visible p-14"
        >
          <FormItem className="w-full h-full">
            <FormControl>
              <Controller
                name="survey.title"
                control={methods.control}
                render={({ field }) => (
                  <Input
                    className="text-foreground border-border placeholder:text-border p-4 px-10 !text-3xl w-full h-full"
                    type="text"
                    placeholder="Survey title"
                    {...field}
                  />
                )}
              />
            </FormControl>
          </FormItem>
          <button onClick={() => {console.log(questions)}} className="text-foreground">data</button>
          <FormItem className="w-full h-full">
            <FormControl>
              <Controller
                name="survey.description"
                control={methods.control}
                render={({ field }) => (
                  <Textarea
                    placeholder="Survey Description"
                    className="text-foreground border-border placeholder:text-border p-4 px-10 !text-xl w-full h-full"
                    {...field}
                  />
                )}
              />
            </FormControl>
          </FormItem>
          {questions.length === 0 && (
            <button
              type="button"
              onClick={() => {
                append({
                  type: "multichoice",
                  question: "",
                  options: [],
                });
              }}
              className="bg-accent text-xl p-4 text-foreground rounded-xl"
            >
              Add Question
            </button>
          )}
          {questions.map((question, index) => {
            switch (question.type) {
              case "multichoice":
                return <QuestionContainer key={index} index={index} type="multichoice"/>;
              case "checkbox":
                return <QuestionContainer key={index} index={index} type="checkbox"/>;
              case "user_input":
                return <QuestionContainer key={index} index={index} type="user_input"/>;
              case "date":
                return <QuestionContainer key={index} index={index} type="date"/>;
              default:
                return null;
            }
          })}
        </form>
      </FormProvider>
    </div>
  );
};

export default page;
