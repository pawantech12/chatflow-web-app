import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
const router = express.Router();

// GET /api/users/me
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

// GET /api/users?search=alice&exclude=123
router.get("/", auth, async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const excludeId = req.query.exclude; // current user id to exclude
    const regex = new RegExp(search, "i");

    console.log(search, excludeId);

    const filter = {
      _id: { $ne: excludeId },
    };

    if (search) {
      filter.$or = [{ name: regex }, { username: regex }, { email: regex }];
    }

    const users = await User.find(filter).select("-password").limit(50);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
