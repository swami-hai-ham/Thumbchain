"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTransaction = void 0;
const web3_js_1 = require("@solana/web3.js");
const client_1 = require("@prisma/client");
const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
const PARENT_WALLET_ADDRESS = "EobSbVfVHF4CEFurp2QDJjrbRRCowLRrr1EVWPDh89Ju";
const RETRY_DELAY = 500;
const prisma = new client_1.PrismaClient();
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000000; // lamports
function getTransactionStatus(signature_1) {
    return __awaiter(this, arguments, void 0, function* (signature, retryCount = 30) {
        const status = yield connection.getSignatureStatus(signature);
        if (status.value === null) {
            if (retryCount < 30) {
                console.log(`Transaction status not available. Retrying in ${RETRY_DELAY}ms...`);
                yield new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
                return getTransactionStatus(signature, retryCount + 1);
            }
            else {
                throw new Error("Transaction status not available after maximum retries");
            }
        }
        return status;
    });
}
const verifyTransaction = (signature, res, responsesNeeded, userAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // transaction existence check
        const transaction = yield connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 1,
        });
        console.log("transaction: ", transaction);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        const status = yield getTransactionStatus(signature);
        console.log("status: ", status);
        //check if txnValid
        const latestBlockHash = yield connection.getLatestBlockhash();
        const isValid = yield connection.confirmTransaction({
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
        if ((transaction === null || transaction === void 0 ? void 0 : transaction.blockTime) && currentTime - (transaction === null || transaction === void 0 ? void 0 : transaction.blockTime) > 300) {
            return res.status(411).json({ message: "Transaction is too old" });
        }
        // check transaction amount
        const transferAmount = transaction.meta.postBalances[1] - transaction.meta.preBalances[1];
        if (transferAmount !== (responsesNeeded / 1000) * web3_js_1.LAMPORTS_PER_SOL) {
            return res.status(411).json({ message: "Incorrect transaction amount" });
        }
        //check addresses
        const senderAddress = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _a === void 0 ? void 0 : _a.toString();
        const recipientAddress = (_b = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _b === void 0 ? void 0 : _b.toString();
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
    }
    catch (error) {
        console.error("Error fetching transaction:", error);
        return res.status(400).json({
            error: "invalid transaction signature",
        });
    }
});
exports.verifyTransaction = verifyTransaction;
