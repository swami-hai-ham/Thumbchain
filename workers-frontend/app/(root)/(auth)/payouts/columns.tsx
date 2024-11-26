"use client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";

export type Payouts = {
  amount: number,
  signature: string
};


export const columns: ColumnDef<Payouts>[] = [
  {
    header: "Serial no.",
    enableSorting: true,
    cell: (info) => `${info.row.index + 1}`,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({row}) => `${Number(row.original.amount)/1000000} SOL`
  },
  {
    accessorKey: "signature",
    header: "Signature",
  }
];
