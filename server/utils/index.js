import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NODE_SUPABASE_URL;
const supabaseKey = process.env.NODE_SUPABASE_KEY;
const jwtSecret = process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseKey || !jwtSecret) {
  throw new Error("Missing environment variables. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const createJWT = (res, userId) => {
  try {
    const token = jwt.sign({ userId }, jwtSecret, {
      expiresIn: "1d",
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    };

    res.cookie("token", token, cookieOptions);
  } catch (error) {
    console.error("Error creating JWT:", error);
    res.status(500).send("Internal Server Error");
  }
};
