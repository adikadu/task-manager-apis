import express from "express";
import { User } from "../models/user";
import { verifyUser } from "../middleware/auth";
import sharp from "sharp";
import multer from "multer";

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
      return cb(new Error("Please upload valid image"));
    cb(undefined, true);
  },
});

export const userRouter = new express.Router();

userRouter.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateToken();
    res.status(201).send({ name: user.name, token });
  } catch (error) {
    console.log("error", error);
    if (error.status === 500) {
      res.status(500).send("Internal server error");
      return;
    }
    res.status(400).send("Signup failed for user");
  }
});

userRouter.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) throw new Error();
    const user = await User.findUserByCreds(email, password);
    if (!user) throw new Error();
    const token = await user.generateToken();
    res.send({ user, token });
  } catch (error) {
    console.log("error", error);
    if (error.status === 500) {
      res.status(500).send("Internal server error");
      return;
    }
    res.status(400).send("login failed for user");
  }
});

userRouter.get("/users/me", verifyUser, async (req, res) => {
  try {
    res.status(200).send({ user: req.user, token: req.token });
  } catch (error) {
    console.log("error", error);
    if (error.status === 500) {
      res.status(500).send("Internal server error");
      return;
    }
    res.status(404).send("User not found");
  }
});

userRouter.post("/users/logout", verifyUser, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token != req.token
    );
    await req.user.save();
    res.status(200).send("Logged out successfully!");
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Internal server error");
  }
});

userRouter.post("/users/logoutAll", verifyUser, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send("Logged out from all devices successfully!");
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Internal server error");
  }
});

userRouter.delete("/users/me", verifyUser, async (req, res) => {
  try {
    await req.user.remove();
    res.status(200).send("User deleted successfully");
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Internal server error");
  }
});

userRouter.patch("/users/me", verifyUser, async (req, res) => {
  try {
    const updatableParams = ["name", "email", "password"];
    const updateParams = Object.keys(req.body);
    let canUpdate = true;
    updateParams.forEach((param) => {
      if (!updatableParams.includes(param)) canUpdate = false;
    });
    if (!canUpdate) {
      res.status(404).send("Bad request");
      return;
    }
    updateParams.forEach((param) => (req.user[param] = req.body[[param]]));
    await req.user.save();
    res.status(200).send("User updated successfully");
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Internal server error");
  }
});

userRouter.post(
  "/users/me/avatar",
  verifyUser,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer();
      req.user.avatar = buffer;
      await req.user.save();
      res.status(200).send("File uploaded successfully");
    } catch (error) {
      console.log("I am here error", error);
      res.status(500).send("Internal server error");
    }
  },
  (error, req, res, next) => {
    console.log("error", error);
    res.status(400).send({ error: error.message });
  }
);

userRouter.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) throw new Error("Avatar not found for user");
    res.set("content-type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    console.log("error", error);
    res.status(400).send(error.message);
  }
});

userRouter.delete("/users/me/avatar", verifyUser, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send("User avatar deleted successfully");
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Error occured while deleting avatar");
  }
});
