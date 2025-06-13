import express from "express";
import userRouter from "./routes/user";
import workerRouter from "./routes/worker";
import cors from "cors";

const app = express();
app.use(cors());

app.use(express.json());

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(3003);
