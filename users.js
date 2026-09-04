const express = require("express");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

/* =====================================================
   GET ALL USERS  ->  GET /api/users
===================================================== */
router.get("/", async (req, res) => {
    const users = await User.find().select("-password");
    res.json({ users: users.map((u) => u.toSafeObject()) });
});

/* =====================================================
   GET ONE USER'S FULL DATA (with totals)  ->  GET /api/users/:id
   Only allowed if it's your own account.
===================================================== */
router.get("/:id", async (req, res) => {

    if (req.params.id !== req.userId) {
        return res
            .status(403)
            .json({ message: "You can only view your own data." });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    const transactions = await Transaction.find({ user: user._id });

    let income = 0;
    let expense = 0;

    transactions.forEach((item) => {
        if (item.type === "income") income += item.amount;
        else expense += item.amount;
    });

    res.json({
        user: user.toSafeObject(),
        income,
        expense,
        balance: income - expense
    });
});

/* =====================================================
   DELETE USER  ->  DELETE /api/users/:id
   Only allowed if it's your own account.
===================================================== */
router.delete("/:id", async (req, res) => {

    if (req.params.id !== req.userId) {
        return res
            .status(403)
            .json({ message: "You can only delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    await Transaction.deleteMany({ user: user._id });

    res.json({ message: "User deleted successfully!" });
});

module.exports = router;