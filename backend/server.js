const express = require("express");
const mongoose = require("mongoose");
const Domain = require("./models/Domain");
const UserLog = require("./models/Login");
const Message = require("./models/Message");  // Import the chat schema
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { createServer } = require("http");
const Author = require('./models/Author');  
const { Server } = require("socket.io");

const JWT_SECRET_KEY = "deuqwncqwufqurfu"

dotenv.config();
app.use(cors());
const corsOptions = {
  origin: ['http://localhost:5174'],  // Add your frontend URL here
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

const SECRET_KEY = process.env.SECRET_KEY || 'sdwucwecuweuwcu';
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// 🔥 SOCKET.IO FOR GLOBAL CHAT 🔥
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send previous messages on connect
  socket.on("getMessages", async () => {
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit("chatHistory", messages);
  });

  // Handle new message
  socket.on("sendMessage", async ({ username, email, message }) => {
    const newMessage = new Message({ username, email, message });
    await newMessage.save();
    
    // Broadcast the message to all clients
    io.emit("receiveMessage", newMessage);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});



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

app.get('/domains/:domainId', async (req, res) => {
  try {
    const data = await Domain.findById(req.params.domainId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(err);
  }
});

app.get('/domains/:domainId/ideas/:ideaId', async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }
    const idea = domain.ideas.id(req.params.ideaId); 
    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }
    res.status(200).json(idea);
  } catch (err) {
    console.error("Error fetching idea:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});


app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const User = new UserLog({
    username,
    email,
    password,
  });

  try {
    const logon = await User.save();
    const token = jwt.sign({ id: logon._id, isAdmin: logon.isAdmin }, SECRET_KEY, { expiresIn: "1h" });

    res.status(200).json({ user: logon, token });  
  } catch (err) {
    console.error("Registration error:", err);
    res.status(400).json({ error: "Error registering user", message: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await UserLog.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    
    // Direct password comparison (plain text)
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id },JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username, 
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/domains/:domainId/topics', async (req, res) => {
  try {
    const { level } = req.query; 
    const domain = await Domain.findById(req.params.domainId);

    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    let topics = [];
    if (level === "easy") {
      topics = domain.topics.easy;
    } else if (level === "medium") {
      topics = domain.topics.medium;
    } else if (level === "hard") {
      topics = domain.topics.hard;
    } else {
      topics = [
        ...domain.topics.easy.map((t) => ({ level: "easy", ...t })),
        ...domain.topics.medium.map((t) => ({ level: "medium", ...t })),
        ...domain.topics.hard.map((t) => ({ level: "hard", ...t })),
      ];
    }

    res.status(200).json(topics);
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


app.post('/addauthor', async (req, res) => {
  const { authorName, authorEmail, topic, bio } = req.body;

  if (!authorName || !authorEmail || !topic) {
    return res.status(400).json({ message: "Author name, email, and topic are required" });
  }

  try {
    const newAuthor = new Author({ authorName, authorEmail, topic, bio });
    await newAuthor.save();
    res.status(201).json({ message: "Author added successfully", newAuthor });

  } catch (error) {
    console.error("Error adding author:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Get All Authors
app.get('/authors', async (req, res) => {
  try {
    const authors = await Author.find();
    res.status(200).json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// Fetch author by topic
// Fetch author by topic
app.get('/authors/topic/:topic', async (req, res) => {
  const { topic } = req.params;

  try {
    // Find the author whose topic matches the provided topic (case-insensitive)
    const author = await Author.findOne({ topic: { $regex: new RegExp(topic, 'i') } });

    if (author) {
      res.status(200).json({ authorName: author.authorName });
    } else {
      res.status(404).json({ message: "No author found for this topic." });
    }
  } catch (error) {
    console.error("Error fetching author by topic:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});