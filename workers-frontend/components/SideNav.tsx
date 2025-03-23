"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import NumberTicker from "./ui/number-ticker";
import axios from "axios";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePendingAmt } from "@/store/dropdown";
type Props = {};

const SideNav = (props: Props) => {
  const { toast } = useToast();
  const navRef = useRef<HTMLDivElement | null>(null);
  const BACKEND_LINK = process.env.NEXT_PUBLIC_BACKEND_LINK;
  const { amount, setAmount } = usePendingAmt();
  const handleWithDraw = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_LINK}/v1/worker/payout`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 200) {
        toast({
          title: "Transaction successful",
          className: "bg-green-500 rounded-xl text-xl",
          duration: 3000,
        });
      }
      const responsepay = await axios.get(`${BACKEND_LINK}/v1/worker/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAmount(Number(responsepay.data.pendingAmount));
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        toast({
          title: "Not Enough money to payout",
          className: "bg-red-500 rounded-xl text-xl",
          duration: 3000,
        });
      } else {
        toast({
          title: "Transaction not successful",
          className: "bg-red-500 rounded-xl text-xl",
          duration: 3000,
        });
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token"); // Get token from local storage
    const fetchBalance = async () => {
      try {
        const response = await axios.get(`${BACKEND_LINK}/v1/worker/balance`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Update the balance state with the response data
        setAmount(Number(response.data.pendingAmount));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance(); // Call the fetch function on component load
    console.log(amount);
  }, []);
  useGSAP(
    () => {
      const q = gsap.utils.selector(navRef.current);
      gsap.fromTo(
        [q(".sideNavLink"), q(".balance"), q(".payout")],
        { autoAlpha: 0, x: -100 },
        { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.2 }
      );
    },
    { scope: navRef }
  );
  return (
    <div
      className="h-screen w-1/4 flex justify-center items-start flex-col gap-12 ml-28"
      ref={navRef}
    >
      <Link
        href={"/"}
        className="flex justify-center items-center gap-6 sideNavLink opacity-0"
      >
        <img src="/home-line.svg" alt="" />
        <span className="text-foreground font-poppins text-xl">Home</span>
      </Link>
      <Link
        href={"/thumbnail"}
        className="flex justify-center items-center gap-6 sideNavLink opacity-0"
      >
        <img src="/youtube-fill.svg" alt="" />
        <span className="text-foreground font-poppins text-xl">Thumbnail</span>
      </Link>
      <Link
        href={"/surveys"}
        className="flex justify-center items-center gap-6 sideNavLink opacity-0"
      >
        <img src="/check-fill.svg" alt="" />
        <span className="text-foreground font-poppins text-xl">Surveys</span>
      </Link>
      <Link
        href={"/payouts"}
        className="flex justify-center items-center gap-6 sideNavLink opacity-0"
      >
        <img src="/btc-fill.svg" alt="" />
        <span className="text-foreground font-poppins text-xl">Payouts</span>
      </Link>
      <div className="flex justify-center items-start w-3/4 flex-col gap-3">
        {amount == 0 ? (
          <div className="text-xl text-foreground balance">
            <span className="mr-2">Pending Balance:</span>{" "}
            <span className="text-foreground text-xl font-bungee">0</span>
          </div>
        ) : (
          <div className="text-xl text-foreground balance">
            <span className="mr-2">Pending Balance:</span>
            <NumberTicker
              value={amount / 1000000}
              decimalPlaces={3}
              delay={1}
              className="text-foreground text-xl font-bungee balance"
            />
          </div>
        )}
      </div>
      <Button
        variant="secondary"
        className="text-xl rounded-xl text-bg font-montserrat p-4 py-5 hover:text-foreground hover:bg-primary payout"
        onClick={handleWithDraw}
      >
        Withdraw
      </Button>
    </div>
  );
};

export default SideNav;
