const express = require("express");
const mongoose = require("mongoose");
const Domain = require("./models/Domain");
const cors = require("cors");
const domainRoutes = require("./routes/domainRoutes");
const topicRoutes = require("./routes/topicRoutes");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb+srv://csundar993:S1RjXYDtC73UGJCE@cluster2.3g8fa.mongodb.net/cirp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());


const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/api/domains", domainRoutes);
app.use("/api/topics", topicRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

app.post('/domainform', upload.single('image'), async (req, res) => {
  const { title, description, topics } = req.body;
  const imageurl = req.file ? `/uploads/${req.file.filename}` : null;

  let parsedTopics;
  try {
    parsedTopics = JSON.parse(topics);
  } catch (error) {
    return res.status(400).json({ error: "Invalid topics format" });
  }

  if (!parsedTopics || !Array.isArray(parsedTopics.easy) || 
      !Array.isArray(parsedTopics.medium) || 
      !Array.isArray(parsedTopics.hard)) {
    return res.status(400).json({ error: 'Topics must be an object with easy, medium, and hard arrays.' });
  }

  const dom = new Domain({ title, imageurl, description, topics: parsedTopics });

  try {
    const savedDomain = await dom.save();
    res.status(201).json(savedDomain);
  } catch (err) {
    res.status(400).json({ error: 'Error saving data', message: err.message });
  }
});

app.get('/domains', async (req, res) => {
  try {
    const dom = await Domain.find();
    res.status(200).json(dom);
  } catch (err) {
    res.status(400).json(err);
  }
});

app.use("/uploads", express.static("uploads"));

app.post("/addidea", upload.single("content"), async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    const { domainId, topic, description } = req.body;
    if (!domainId || !topic || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contentFilePath = req.file ? req.file.path : null;
    if (!contentFilePath) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const foundDomain = await Domain.findById(domainId);
    if (!foundDomain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    if (!foundDomain.ideas) {
      foundDomain.ideas = [];
    }

    foundDomain.ideas.push({ topic, description, content: contentFilePath });
    await foundDomain.save();

    res.status(201).json({ message: "Idea added successfully", domain: foundDomain });
  } catch (error) {
    console.error("Error adding idea:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
