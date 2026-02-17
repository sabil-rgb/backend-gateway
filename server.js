const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let activeVPS = {
  ip: "",
  password: ""
};

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Gateway Active 🚀" });
});

// Set VPS (owner only nanti bisa tambah auth)
app.post("/set-vps", (req, res) => {
  const { ip, password } = req.body;
  activeVPS.ip = ip;
  activeVPS.password = password;

  res.json({ message: "VPS Updated", activeVPS });
});

// Get VPS
app.get("/get-vps", (req, res) => {
  res.json(activeVPS);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
