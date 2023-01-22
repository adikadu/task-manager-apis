import mongoose from "mongoose";

const tasksSchema = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Creating a reference to "User" model.
    },
  },
  { timestamps: true }
);

tasksSchema.methods.toJSON = function () {
  const taskObj = this.toObject();
  return taskObj;
};

export const Tasks = mongoose.model("Tasks", tasksSchema);
