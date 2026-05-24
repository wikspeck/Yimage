import cors from "cors";
import express from "express";
import { imageSize } from "image-size";
import multer from "multer";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3001;
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "images.json");
const distDir = path.join(__dirname, "dist");

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    await mkdir(uploadsDir, { recursive: true });
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    callback(null, `${Date.now()}-${nanoid(8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  }
});

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(uploadsDir));

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(uploadsDir, { recursive: true });
  try {
    await stat(dbFile);
  } catch {
    await writeFile(dbFile, "[]", "utf8");
  }
}

async function readImages() {
  await ensureDb();
  const raw = await readFile(dbFile, "utf8");
  return JSON.parse(raw);
}

async function writeImages(images) {
  await ensureDb();
  await writeFile(dbFile, JSON.stringify(images, null, 2), "utf8");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/images", async (_req, res) => {
  const images = await readImages();
  res.json(images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get("/api/images/:id", async (req, res) => {
  const images = await readImages();
  const index = images.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Not found" });
  }

  images[index].views += 1;
  await writeImages(images);
  return res.json(images[index]);
});

app.post("/api/images", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image is required" });
  }

  const images = await readImages();
  const fileBuffer = await readFile(req.file.path);
  const dimensions = imageSize(fileBuffer);
  const entry = {
    id: nanoid(10),
    title: (req.body.title || "").trim(),
    description: (req.body.description || "").trim(),
    tags: String(req.body.tags || "")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8),
    imageUrl: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    width: dimensions.width || 0,
    height: dimensions.height || 0,
    views: 0,
    createdAt: new Date().toISOString()
  };

  images.push(entry);
  await writeImages(images);
  return res.status(201).json(entry);
});

app.delete("/api/images/:id", async (req, res) => {
  const images = await readImages();
  const target = images.find((item) => item.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: "Not found" });
  }

  const nextImages = images.filter((item) => item.id !== req.params.id);
  await writeImages(nextImages);
  await rm(path.join(uploadsDir, target.filename), { force: true });
  return res.json({ ok: true });
});

app.use(express.static(distDir));

app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
    return next();
  }
  return res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, async () => {
  await ensureDb();
  console.log(`Yimage API running on http://localhost:${port}`);
});
