import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error("Invalid email");
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (value.length <= 6) throw new Error("password too short");
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("tasks", {
  ref: "Tasks",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.toJSON = function () {
  const userObj = this.toObject();

  delete userObj.password;
  delete userObj.tokens;
  delete userObj.__v;

  return userObj;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password"))
    user.password = await bcryptjs.hash(user.password, 8);
  next();
});

userSchema.methods.generateToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET_KEY
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findUserByCreds = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) return;
  const isPasswordCorrect = await bcryptjs.compare(password, user.password);
  if (!isPasswordCorrect) return;
  return user;
};

export const User = mongoose.model("User", userSchema);
