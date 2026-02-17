const express = require("express");
const cors = require("cors");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET tidak ditemukan di environment variables!");
  process.exit(1);
}

// ================= ROLE LEVEL =================
const ROLE_LEVEL = {
  user: 1,
  ress: 2,
  pt: 3,
  own: 4,
  ceo: 5,
  owner: 6
};

// ================= DATABASE =================
let users = [];

if (fs.existsSync("users.json")) {
  users = JSON.parse(fs.readFileSync("users.json"));
} else {
  users = [
    { username: "sabilofficial", pin: "201012", role: "owner" }
  ];
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

// ================= AUTH MIDDLEWARE =================
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token tidak ada" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token tidak valid" });
  }
}

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ message: "Username & PIN wajib diisi" });
  }

  const user = users.find(
    u => u.username === username && u.pin === pin
  );

  if (!user) {
    return res.status(401).json({ message: "Login gagal" });
  }

  const token = jwt.sign(
    {
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login berhasil",
    token,
    role: user.role
  });
});

// ================= CREATE USER =================
app.post("/create-user", auth, (req, res) => {
  const { username, pin, role } = req.body;
  const creatorRole = req.user.role;

  if (!username || !pin || !role) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  if (!ROLE_LEVEL[role]) {
    return res.status(400).json({ message: "Role tidak valid" });
  }

  if (ROLE_LEVEL[creatorRole] <= ROLE_LEVEL[role]) {
    return res.status(403).json({
      message: "Tidak punya izin membuat role ini"
    });
  }

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: "Username sudah ada" });
  }

  users.push({ username, pin, role });
  saveUsers();

  res.json({ message: "Akun berhasil dibuat" });
});

// ================= DELETE USER =================
app.post("/delete-user", auth, (req, res) => {
  const { targetUsername } = req.body;
  const creatorRole = req.user.role;

  if (!targetUsername) {
    return res.status(400).json({ message: "Username target wajib diisi" });
  }

  const target = users.find(u => u.username === targetUsername);

  if (!target) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  if (ROLE_LEVEL[creatorRole] <= ROLE_LEVEL[target.role]) {
    return res.status(403).json({
      message: "Tidak punya izin hapus akun ini"
    });
  }

  users = users.filter(u => u.username !== targetUsername);
  saveUsers();

  res.json({ message: "User berhasil dihapus" });
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
