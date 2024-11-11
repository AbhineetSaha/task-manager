import jwt, { decode } from "jsonwebtoken";
import { supabase } from "../utils/index.js";
const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    console.log(token);

    if (token) {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      const resp = await supabase
        .from("users")
        .select("isAdmin email")
        .eq(decodedToken.userId, "id")
        .single();

      req.user = {
        email: resp.email,
        isAdmin: resp.isAdmin,
        userId: decodedToken.userId,
      };

      next();
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Not authorized. Try login again." });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(401)
      .json({ status: false, message: "Not authorized. Try login again." });
  }
};

const isAdminRoute = async (req, res, next) => {
  const resp = await supabase
    .from("users")
    .select("isAdmin")
    .eq("id", req.user.userId)
    .single();
  console.log(resp);
  if (req.user && resp.data.isAdmin) {
    next();
  } else {
    return res.status(401).json({
      status: false,
      message: "Not authorized as admin. Try login as admin.",
    });
  }
};

export { isAdminRoute, protectRoute };
