import express from "express";
import { verifyUser } from "../middleware/auth";
import { Tasks } from "../models/tasks";

export const taskRouter = new express.Router();

taskRouter.post("/tasks", verifyUser, async (req, res) => {
  try {
    const task = new Tasks({ ...req.body, owner: req.user._id });
    await task.save();
    res.status(201).send("Task got saved successfully");
  } catch (error) {
    console.log("error", error);
    res.status(404).send("Invalid request");
  }
});

taskRouter.get("/tasks", verifyUser, async (req, res) => {
  try {
    const match = {};
    if (req.query.status) match.status = req.query.status === "true";

    const sort = {};
    if (req.query.sort) {
      const parts = req.query.sort.split(":");
      sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
    }

    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.status(200).send(req.user.tasks);
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Internal server error");
  }
});

taskRouter.get("/tasks/:id", verifyUser, async (req, res) => {
  try {
    const _id = req.params.id;
    const resTask = await Tasks.findOne({ _id, owner: req.user._id });
    if (!resTask) return res.status(404).send("Task not found");
    res.status(200).send(resTask);
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Internal server error");
  }
});

taskRouter.get("/tasks/:id", verifyUser, async (req, res) => {
  const _id = req.params.id;
  try {
    const dbRes = await Task.findOne({ _id, owner: req.user._id });
    if (!dbRes) return res.status(404).send("Task not found");
    res.status(200).send(dbRes);
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

taskRouter.patch("/tasks/:id", verifyUser, async (req, res) => {
  const validKeys = ["title", "status"];
  const reqKeys = Object.keys(req.body);
  const isOperationAllowed = reqKeys.every((key) => validKeys.includes(key));

  if (!isOperationAllowed) return res.status(404).send("Invalid key");

  try {
    const dbRes = await Tasks.updateOne(
      {
        _id: req.params.id,
        owner: req.user._id,
      },
      { ...req.body }
    );
    if (!dbRes || !dbRes.matchedCount)
      return res.status(404).send("Update declined");
    res.status(200).send("Successfully updated the task");
  } catch (error) {
    console.log("error", error);
    res.status(400).send(error);
  }
});

taskRouter.delete("/tasks/:id", verifyUser, async (req, res) => {
  try {
    const dbRes = await Tasks.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!dbRes) return res.status(404).send("Delete declined");

    res.status(200).send(dbRes);
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Internal server error");
  }
});
