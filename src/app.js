import express from "express";
import "./mongooseConnect";
import { userRouter } from "./routes/user";
import { taskRouter } from "./routes/tasks";

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.get("/", (req, res) => {
  res.status(200).send("All good");
});

app.listen(process.env.PORT, () =>
  console.log(`Server started on port: ${process.env.PORT}`)
);
