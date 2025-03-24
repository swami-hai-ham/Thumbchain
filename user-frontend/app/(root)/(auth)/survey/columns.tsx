"use client";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { parse } from "json2csv";

export type Data = {
  id: number;
  title: string;
  status: "Done" | "Pending";
  amount: number;
};

const generateCSV = async (surveyId: string) => {
  const BACKEND_LINK = process.env.NEXT_PUBLIC_BACKEND_LINK;
  const token = localStorage.getItem("token");
  surveyId = surveyId.replace(/^"|"$/g, "");
  if (!token) return alert("No auth token found!");
  console.log(`${BACKEND_LINK}/v1/user/survey/csvdata/${surveyId}`);
  const res = await axios.get(
    `${BACKEND_LINK}/v1/user/survey/csvdata/${surveyId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log(res);

  const csv = parse(res.data.csvData);
  const blob = new Blob([csv], { type: "text/csv" });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `survey_${surveyId}_responses.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const columns: ColumnDef<Data>[] = [
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
    cell: ({ row }) => `${Number(row.original.amount) / 1000000} SOL`,
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => (
      <button onClick={() => generateCSV(JSON.stringify(row.original.id))}>
        Download CSV
      </button>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];
