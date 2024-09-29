"use client"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link";


// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: number;
  title: string;
  status: "Done" | "Pending";
  result: string;
  amount: number
}


export const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "id",
      header: "ID",
      enableSorting: true
    },
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: true
    },
    {
        accessorKey: "amount",
        header: "Amount",
        enableSorting: true
    },
    {
      accessorKey: "result",
      header: "Result",
      cell: ({ row }) => (
        <Link href={row.original.result}>View Result</Link>
      ),
      
    },
  ];