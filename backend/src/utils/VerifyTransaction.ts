import { Response } from "express";
import {
  AddressLookupTableAccount,
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { PrismaClient } from "@prisma/client";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const PARENT_WALLET_ADDRESS = "EobSbVfVHF4CEFurp2QDJjrbRRCowLRrr1EVWPDh89Ju";
const RETRY_DELAY = 500;
const prisma = new PrismaClient();
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000_000; // lamports

async function getTransactionStatus(signature: string, retryCount = 30) {
  const status = await connection.getSignatureStatus(signature);
  if (status.value === null) {
    if (retryCount < 30) {
      console.log(
        `Transaction status not available. Retrying in ${RETRY_DELAY}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return getTransactionStatus(signature, retryCount + 1);
    } else {
      throw new Error("Transaction status not available after maximum retries");
    }
  }

  return status;
}

export const verifyTransaction = async (
  signature: string,
  res: Response,
  responsesNeeded: number,
  userAddress: string
) => {
  try {
    // transaction existence check
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 1,
    });
    console.log("transaction: ", transaction);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    const status = await getTransactionStatus(signature);
    console.log("status: ", status);

    //check if txnValid
    const latestBlockHash = await connection.getLatestBlockhash();
    const isValid = await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    });
    console.log(isValid);
    if (!isValid) {
      return res.status(411).json({ message: "Invalid transaction signature" });
    }

    //check if recent transaction
    const currentTime = new Date().getTime() / 1000;
    // console.log("currentTime:", currentTime);
    if (transaction?.blockTime && currentTime - transaction?.blockTime > 300) {
      return res.status(411).json({ message: "Transaction is too old" });
    }

    // check transaction amount
    const transferAmount =
      transaction!.meta!.postBalances[1] - transaction!.meta!.preBalances[1];
    if (transferAmount !== (responsesNeeded / 1000) * LAMPORTS_PER_SOL) {
      return res.status(411).json({ message: "Incorrect transaction amount" });
    }

    //check addresses
    const senderAddress = transaction?.transaction.message
      .getAccountKeys()
      .get(0)
      ?.toString();
    const recipientAddress = transaction?.transaction.message
      .getAccountKeys()
      .get(1)
      ?.toString();
    console.log(senderAddress, recipientAddress, "address");
    if (senderAddress !== userAddress) {
      return res
        .status(411)
        .json({ message: "Transaction not sent from user's address" });
    }

    if (recipientAddress !== PARENT_WALLET_ADDRESS) {
      return res
        .status(411)
        .json({ message: "Transaction not sent to correct address" });
    }

    // logs
    console.log("Transfer amount:", transferAmount);
    console.log("Sender address:", senderAddress);
    console.log("Recipient address:", recipientAddress);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return res.status(400).json({
      error: "invalid transaction signature",
    });
  }
};
