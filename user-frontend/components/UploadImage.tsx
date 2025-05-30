"use client";

// Core React
import React, { useState, useEffect, useRef } from "react";

// UI Components
import Spinner from "./Spinner";
import CountryDropdown from "./dropdown/countries";

// Animation Libraries
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Cloudinary Upload Widget
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from "next-cloudinary";

// Hooks
import { useToast } from "@/hooks/use-toast";
import { useDropdownStore } from "@/store/dropdown";

// Solana Wallet & Blockchain
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

// Navigation & API
import { useRouter } from "next/navigation";
import axios from "axios";

interface UploadedImage {
  url: string;
  width: number;
  height: number;
}

interface SubmitObject {
  options: { imageUrl: string }[];
  signature: string;
  title: string;
  country: string | null;
  responsesNeeded: number;
}

function convertLinksToObject(
  links: UploadedImage[],
  signature: string,
  title: string,
  countryValue: string,
  responsesNeeded: number
): SubmitObject {
  const options = links.map((link) => ({ imageUrl: link.url }));

  return {
    options,
    signature,
    title,
    country: countryValue ? countryValue : null,
    responsesNeeded,
  };
}

const UploadImage: React.FC = () => {
  //Image
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  // Input
  const { countryValue } = useDropdownStore();
  const [responsesNeeded, setResponsesNeeded] = useState(100);
  const [title, setTitle] = useState("");
  // Web3
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  // GSAP
  const divRef = useRef<HTMLDivElement | null>(null);
  gsap.config({
    nullTargetWarn: false,
  });
  // functionality
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [disabled, setDisabled] = useState(false);
  const router = useRouter();

  //Use Effects
  useEffect(() => {
    console.log("Uploaded Images:", uploadedImages);
  }, [uploadedImages]);

  useEffect(() => {
    const savedImages = localStorage.getItem("uploadedImages");
    console.log(savedImages);
    if (savedImages) {
      const images = JSON.parse(savedImages);
      console.log(images);
      setUploadedImages(images);
      if (images && images.length != 0) {
        setDisabled(true);
      }
    }
  }, []);

  //Submission
  async function makePaymentandSubmitTask() {
    if (!title || title.length == 0 || uploadedImages.length < 2) {
      toast({
        title: "Please give appropriate input",
        variant: "destructive",
        description: "Upload more than 1 image & give title to your task",
        className: "bg-red-500 rounded-xl text-sm",
      });
    } else {
      setLoading(true);
      const lamportsPerSol = 1_000_000_000;
      const lamports = (responsesNeeded / 1000) * lamportsPerSol;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: new PublicKey(
            "EobSbVfVHF4CEFurp2QDJjrbRRCowLRrr1EVWPDh89Ju"
          ),
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
            className: "bg-yellow-500 rounded-xl text-sm",
          });
          setLoading(false);
        } else {
          toast({
            title: "Transaction Error",
            description: e?.message || "An unexpected error occurred.",
            variant: "destructive",
            className: "bg-red-500 rounded-xl text-sm",
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
      console.log(signature);
      await Submit(signature);
      setLoading(false);
    }
  }
  const Submit = async (signature: string, retries: number = 5) => {
    const burl = process.env.NEXT_PUBLIC_BACKEND_LINK + "/v1/user/task" || "";
    const submitObj = convertLinksToObject(
      uploadedImages,
      signature,
      title,
      countryValue,
      responsesNeeded
    );
    console.log(submitObj);

    try {
      const { data } = await axios.post(burl, submitObj, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log(data);
      localStorage.removeItem("uploadedImages");
      setUploadedImages([]);
      toast({
        title: "Transaction successful",
        description: `Signature: ${signature}`,
        className: "bg-green-500 rounded-xl text-sm",
        duration: 3000,
      });
      setLoading(false);
      router.push(`/thumbnail/task/${data.id}`);
    } catch (e: any) {
      if (e.response?.status === 500 && retries > 0) {
        // Retry the request
        console.log(`Retrying... Attempts left: ${retries - 1}`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        return Submit(signature, retries - 1); // Recursively call Submit with reduced retries
      } else {
        // Handle other errors or no retries left
        toast({
          title: e.code || "Error",
          variant: "destructive",
          description: e.message || "An error occurred",
          className: "bg-red-500 rounded-xl text-sm",
        });
        setLoading(false);
        console.log(e);
      }
    }
  };

  // Cloudinary
  const handleSuccess = async (result: {
    info?: string | CloudinaryUploadWidgetInfo;
  }) => {
    if (typeof result.info === "object" && result.info !== null) {
      const { secure_url, width, height } = result.info;

      setUploadedImages((prevImages) => {
        const newImages = [...prevImages, { url: secure_url, width, height }];

        if (newImages.length >= 10) {
          setDisabled(true);
        }
        localStorage.setItem("uploadedImages", JSON.stringify(newImages));
        return newImages;
      });
    } else {
      console.error("Unexpected result.info type:", result.info);
    }
  };

  //GSAP
  useGSAP(
    () => {
      const q = gsap.utils.selector(divRef.current);
      gsap.fromTo(
        q(".images"),
        { autoAlpha: 0, scale: 0.5, rotate: -20 },
        { autoAlpha: 1, scale: 1, stagger: 0.2, duration: 0.5, rotate: 0 }
      );
    },
    { dependencies: [uploadedImages], scope: divRef }
  );
  useGSAP(
    () => {
      const q = gsap.utils.selector(divRef.current);
      gsap.fromTo(
        [q(".input"), q(".upload"), q(".country"), q(".submit")],
        { autoAlpha: 0 },
        { stagger: 0.2, autoAlpha: 1, duration: 0.5, ease: "power1.inOut" }
      );
    },
    { dependencies: [], scope: divRef }
  );
  return (
    <div
      className="size-full flex flex-col justify-start items-center overflow-visible text-foreground"
      ref={divRef}
    >
      <label
        htmlFor="input"
        className="opacity-0 input font-poppins text-2xl text-foreground w-3/4 mt-5 flex justify-start items-center"
      >
        Title
      </label>
      <input
        type="text"
        className="opacity-0 input bg-input w-3/4 h-10 m-5 p-8 text-lg font-poppins text-foreground"
        onChange={(e) => {
          setTitle(e.target.value);
        }}
        placeholder="Select the most appealing thumbnail."
        disabled={loading}
      />
      <div className="h-screen w-full flex flex-col justify-start items-center">
        <div className="relative w-3/4 h-1/2 border-border border-2 m-10 flex flex-col p-8 upload opacity-0">
          <div className="flex w-full justify-between items-center">
            <h3 className="text-2xl text-foreground font-poppins mx-2 my-5">
              Upload Images
            </h3>
            <button
              className="flex justify-center items-center text-foreground text-sm gap-2"
              onClick={() => {
                setDisabled(false);
                setUploadedImages([]);
                localStorage.setItem("uploadedImages", JSON.stringify([]));
              }}
              disabled={loading}
            >
              Retry{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-3000 ease-in-out transform hover:rotate-[360deg] group"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="rgba(77,77,77,1)"
              >
                <path d="M12 4C14.5905 4 16.8939 5.23053 18.3573 7.14274L16 9.5H22V3.5L19.7814 5.71863C17.9494 3.452 15.1444 2 12 2 6.47715 2 2 6.47715 2 12H4C4 7.58172 7.58172 4 12 4ZM20 12C20 16.4183 16.4183 20 12 20 9.40951 20 7.10605 18.7695 5.64274 16.8573L8 14.5 2 14.5V20.5L4.21863 18.2814C6.05062 20.548 8.85557 22 12 22 17.5228 22 22 17.5228 22 12H20Z"></path>
              </svg>
            </button>
          </div>
          <div className="relative flex flex-col items-center justify-center w-full h-1/2 flex-grow border-dashed border-primary border-2">
            <div className="rounded-lg shadow-lg w-full h-full">
              <CldUploadWidget
                uploadPreset="dfsdfsdfsd"
                options={{
                  resourceType: "image",
                  clientAllowedFormats: [
                    "jpg",
                    "png",
                    "gif",
                    "jpeg",
                    "webp",
                    "bmp",
                    "svg",
                  ],
                  maxFiles: 10,
                }}
                onSuccess={handleSuccess}
                onQueuesEnd={() => {
                  setDisabled(true);
                }}
              >
                {({ open }) => (
                  <button
                    onClick={() => open()}
                    className={`h-full w-full flex justify-center items-center text-white rounded-md p-6 ${
                      disabled ? "cursor-not-allowed bg-muted" : ""
                    }`}
                    disabled={disabled}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-6 text-foreground"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
                      />
                    </svg>
                  </button>
                )}
              </CldUploadWidget>
            </div>
          </div>
          <div className="flex w-full h-10 justify-between items-center text-border uppercase text-sm px-2">
            <span>Supported Formats: jpg, png, gif, jpeg, webp, bmp, svg</span>
            <span className="flex justify-center items-center">
              maxfiles: 10
            </span>
          </div>
        </div>
        <div className="w-full flex justify-center flex-col">
          <div className="flex justify-center items-center gap-4 country opacity-0">
            <span>Select target country:</span>{" "}
            <CountryDropdown disabled={loading} />{" "}
            <span className="text-border">{"(optional)"}</span>
          </div>
          <div className="flex justify-center items-center country opacity-0 m-10">
            <label
              htmlFor="input"
              className="opacity-0 input font-poppins text-sm text-foreground flex justify-start items-center mx-4"
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
            <span className="text-lg">{`${responsesNeeded}`}</span>
            {/* <button className="submit font-poppins text-foreground hover:scale-[120%] m-20 shadow-[inset_0_0_0_2px_#616467] text-black px-12 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200">
        {payLoading ? <Spinner/> : `Pay ${responsesNeeded/1000} SOL`}
      </button>  */}
          </div>
        </div>
        <div className="flex justify-center items-start gap-4 max-w-full mx-5">
          {uploadedImages &&
            uploadedImages.map(
              (
                img: { url: string; width: number; height: number },
                idx: number
              ) => (
                <div key={idx} className="relative images">
                  <img
                    src={img.url}
                    style={{
                      width: Math.min(img.width, 300), // Max width cap to prevent overflow
                      height: Math.min(img.height, 300),
                    }}
                    className="shadow-md object-contain"
                    alt={`uploaded-${idx}`}
                  />
                </div>
              )
            )}
        </div>
      </div>
      <button
        hidden={!disabled}
        disabled={loading}
        onClick={makePaymentandSubmitTask}
        className="opacity-0 submit mt-56 font-poppins text-foreground text-sm hover:scale-[120%] m-20 shadow-[inset_0_0_0_2px_#616467] px-12 py-4 rounded-full tracking-widest uppercase font-semibold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200"
      >
        {loading ? <Spinner /> : `Pay ${responsesNeeded / 1000} SOL`}
      </button>
    </div>
  );
};

export default UploadImage;
