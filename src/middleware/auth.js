import jwt from "jsonwebtoken";
import { User } from "../models/user";

export async function verifyUser(req, res, next) {
  try {
    const authToken = req.header("Authorization").replace("Bearer ", "");
    if (!authToken) throw new Error();
    const jwtVerifiedToken = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    const user = await User.findOne({
      _id: jwtVerifiedToken._id,
      "tokens.token": authToken,
    });
    if (!user) throw new Error();
    req.user = user;
    req.token = authToken;
    next();
  } catch (error) {
    console.log("error", error);
    res.status(404).send("User verification failed");
  }
}
