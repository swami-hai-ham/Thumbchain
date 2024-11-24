"use client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";

export type Payment = {
  id: number;
  title: string;
  status: "Done" | "Pending";
  result: string;
  amount: number;
  country: string;
  redirectURL: string;
};


export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: true,
  },
  {
    accessorKey: "title",
    header: "Title",
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    enableSorting: true,
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => <Link href={row.original.result}>View Result</Link>,
  },
  {
    accessorKey: "country",
    header: " Country",
    enableSorting: true,
  },
  {
    accessorKey: "redirectURL",
    header: "Copy Link",
    cell: ({ row }) => {
      const [clicked, setClicked] = useState(false);

      const copyLink = async (url: string) => {
        try {
          await navigator.clipboard.writeText(url);
          setClicked(true); // Trigger animation
          setTimeout(() => setClicked(false), 500); // Reset animation
        } catch (error) {
          console.error("Failed to copy text: ", error);
        }
      };

      return (
        <button
          onClick={() => copyLink(row.original.redirectURL)}
          className={'text-white'}
        >
          {clicked ? "Copied!" : "Copy link"}
        </button>
      );
    },
  },
];
