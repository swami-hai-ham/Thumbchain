"use client";
import React, { useEffect, useState } from "react";

// UI Components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormItem } from "@/components/ui/form";
import Spinner from "@/components/Spinner";
import QuestionContainer from "@/components/Form/QuestionContainer";
import CountryDropdown from "@/components/dropdown/countries";

// Form Handling
import { SurveyFormSchema } from "@/zod/formSchema";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";

// Animations
import gsap from "gsap";

// Hooks
import { useToast } from "@/hooks/use-toast";
import { useDropdownStore } from "@/store/dropdown";

// Solana Wallet & Connection
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

// Navigation & API
import { useRouter } from "next/navigation";
import axios from "axios";

type Props = {};
type FormData = z.infer<typeof SurveyFormSchema>;

const Page = (props: Props) => {
  // FORM
  const methods = useForm<FormData>({
    resolver: zodResolver(SurveyFormSchema),
    mode: "onChange",
  });
  const { watch } = methods;
  const { toast } = useToast();
  const [responsesNeeded, setResponsesNeeded] = useState(100);
  const questions = watch("questions") || [];
  const survey = watch() || [];
  const { countryValue } = useDropdownStore();
  const [title, description] = useWatch({
    control: methods.control,
    name: ["survey.title", "survey.description"],
  });
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "questions",
  });

  //WEB3
  const [txSignature, setTxSignature] = useState("");
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Functionality
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const router = useRouter();

  //GSAP
  gsap.config({
    nullTargetWarn: false,
  });

  const onSubmit = async (data: any) => {
    const isValid = await methods.trigger();
    if (!isValid) {
      toast({
        title: "Invalid Form Data",
        description: "Fix errors before submission.",
        className: "bg-red-500 rounded-xltext-md",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    // console.log(data);
    const filteredData = data.questions.map((item: any) => {
      // Remove undefined fields from each object
      return Object.fromEntries(
        Object.entries(item).filter(([_, value]) => value !== undefined)
      );
    });

    const lamportsPerSol = 1_000_000_000;
    const lamports = (responsesNeeded / 1000) * lamportsPerSol;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey!,
        toPubkey: new PublicKey("EobSbVfVHF4CEFurp2QDJjrbRRCowLRrr1EVWPDh89Ju"),
        lamports: lamports,
      })
    );

    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(transaction, connection, {
      minContextSlot,
    }).catch((e: any) => {
      if (
        e?.message?.includes("User rejected the request") ||
        e?.code === 4001
      ) {
        toast({
          title: "Transaction Denied",
          description: "You rejected the transaction request.",
          className: "bg-yellow-500 rounded-xltext-md",
        });
        setLoading(false);
      } else {
        toast({
          title: "Transaction Error",
          description: e?.message || "An unexpected error occurred.",
          variant: "destructive",
          className: "bg-red-500 rounded-xltext-md",
        });
      }
      setLoading(false);
      console.error(e);
      return null;
    });
    if (!signature) return;
    const confirmation = await Promise.race([
      connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      ),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Transaction confirmation timeout")),
          30000
        )
      ),
    ]);
    console.log(confirmation);
    console.log(signature);
    setTxSignature(signature);
    const burl = process.env.NEXT_PUBLIC_BACKEND_LINK + "/v1/user/survey" || "";
    const submitObj = {
      survey: data.survey,
      questions: filteredData,
      signature: signature,
      responsesNeeded: responsesNeeded,
      country: countryValue,
    };
    console.log(submitObj);
    try {
      const { data, status } = await axios.post(burl, submitObj, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log(data);
      localStorage.removeItem("localValue");
      toast({
        title: "Transaction successful",
        description: `Signature: ${signature}`,
        className: "bg-green-500 rounded-xltext-md",
        duration: 3000,
      });
      setLoading(false);
      router.push(`/tasks`);
    } catch (e: any) {
      toast({
        title: e.code,
        variant: "destructive",
        description: e.message,
        className: "bg-red-500 rounded-xltext-md",
      });
      setLoading(false);
      console.log(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (localStorage.getItem("localValue") != null) {
      const resetValue = localStorage.getItem("localValue") || "";
      methods.reset(JSON.parse(resetValue));
      methods.trigger();
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const { survey, questions } = methods.getValues(); // Get only the required fields
      localStorage.setItem("localValue", JSON.stringify({ survey, questions }));
    }, 700);

    return () => clearTimeout(handler);
  }, [questions, title, description, methods]);

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
                    className="text-foreground border-border placeholder:text-border p-4 px-10 !text-xl w-full h-full"
                    type="text"
                    placeholder="Survey title"
                    {...field}
                  />
                )}
              />
            </FormControl>
          </FormItem>
          <FormItem className="w-full h-full">
            <FormControl>
              <Controller
                name="survey.description"
                control={methods.control}
                render={({ field }) => (
                  <Textarea
                    placeholder="Survey Description"
                    className="text-foreground border-border placeholder:text-border p-4 px-10 text-lg w-full h-full"
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
              className="bg-accent text-md p-2 text-foreground rounded-md"
            >
              Add Question
            </button>
          )}
          {questions.map((question, index) => {
            switch (question.type) {
              case "multichoice":
                return (
                  <QuestionContainer
                    key={index}
                    index={index}
                    type="multichoice"
                  />
                );
              case "checkbox":
                return (
                  <QuestionContainer
                    key={index}
                    index={index}
                    type="checkbox"
                  />
                );
              case "user_input":
                return (
                  <QuestionContainer
                    key={index}
                    index={index}
                    type="user_input"
                  />
                );
              case "date":
                return (
                  <QuestionContainer key={index} index={index} type="date" />
                );
              default:
                return null;
            }
          })}
          <div className="flex justify-center items-center country m-10 text-foreground">
            <label
              htmlFor="input"
              className="input font-semibold font-poppins text-md text-foreground flex justify-start items-center mx-4"
            >
              Number of Responses :
            </label>
            <input
              type="range"
              disabled={loading}
              className="mx-4"
              onChange={(e) => {
                setResponsesNeeded(Number(e.target.value));
              }}
              value={responsesNeeded}
              min={100}
              max={1000}
              step={50}
            />
            <span className="text-md">{`${responsesNeeded}`}</span>
          </div>
          <button
            type="submit"
            onClick={() => {
              methods.trigger().then((isValid) => {
                if (!isValid) {
                  console.log(methods.formState.errors);
                  toast({
                    title: "Invalid Form Data",
                    description: "Fill all the data completely",
                    className: "bg-red-500 rounded-xl text-md",
                    variant: "destructive",
                  });
                }
              });
            }}
            className="submit font-poppins text-sm text-foreground hover:scale-[120%] m-20 shadow-[inset_0_0_0_2px_#616467] text-black px-8 py-3 rounded-full tracking-widest uppercase font-semibold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200"
          >
            {loading ? <Spinner /> : `Pay ${responsesNeeded / 1000} SOL`}
          </button>
        </form>
      </FormProvider>
    </div>
  );
};

export default Page;
