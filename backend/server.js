const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const domainRoutes = require("./routes/domains");
const ideaRoutes = require("./routes/ideas");
const authorRoutes = require("./routes/authors");
const commentRoutes = require("./routes/comments");
const chatRoutes = require("./routes/chat");

// Import middleware
const { errorHandler } = require("./middleware/auth");

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

// ✅ FIXED: More permissive CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ FIXED: Modified helmet configuration to allow images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5000", "https://via.placeholder.com"],
      connectSrc: ["'self'", "ws://localhost:5000", "http://localhost:5000"],
    },
  },
}));

app.use(compression());
app.use(morgan("combined"));
app.use(limiter);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Create upload directories if they don't exist
const uploadDirs = [
  "uploads",
  "uploads/domains",
  "uploads/ideas", 
  "uploads/authors",
  "uploads/pdfs",
  "uploads/defaults"
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// ✅ FIXED: Enhanced static file serving with proper CORS headers
app.use("/uploads", (req, res, next) => {
  // Set CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path) => {
    // Set cache headers for better performance
    res.set('Cache-Control', 'public, max-age=86400'); // 1 day cache
  }
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://csundar993:S1RjXYDtC73UGJCE@cluster2.3g8fa.mongodb.net/cirp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Socket.IO for real-time chat - FIXED VERSION
const Message = require("./models/Message");

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);

  // Send global chat history when user connects
  socket.on("getMessages", async () => {
    try {
      console.log("Fetching global messages for user:", socket.id);
      
      // Get global messages (improved query)
      const messages = await Message.find({
        $or: [
          { messageType: 'global' },
          { messageType: { $exists: false } }, // Legacy messages without messageType
          { 
            $and: [
              { domainId: { $in: [null, undefined] } },
              { messageType: { $ne: 'domain' } }
            ]
          }
        ],
        isDeleted: { $ne: true },
        status: { $ne: 'flagged' }
      })
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(100)
      .populate('userId', 'username fullName profileImage')
      .lean(); // Use lean() for better performance
      
      console.log(`Found ${messages.length} global messages`);
      
      // Format messages for frontend compatibility
      const formattedMessages = messages.map(msg => ({
        _id: msg._id,
        username: msg.username,
        email: msg.email,
        message: msg.message || msg.content,
        content: msg.content || msg.message,
        timestamp: msg.timestamp || msg.createdAt,
        messageType: msg.messageType || 'global',
        userId: msg.userId
      }));
      
      // Send messages in chronological order (oldest first)
      socket.emit("chatHistory", formattedMessages.reverse());
    } catch (error) {
      console.error("Error fetching chat history:", error);
      socket.emit("chatHistory", []);
    }
  });

  // Handle new global message
  socket.on("sendMessage", async ({ username, email, message, domainId }) => {
    try {
      console.log("Received global message:", { username, email, message: message?.substring(0, 50) });
      
      if (!message || message.trim() === '') {
        console.log("Empty message, ignoring");
        socket.emit("messageError", { error: "Message cannot be empty" });
        return;
      }

      if (!username || !email) {
        console.log("Missing username or email");
        socket.emit("messageError", { error: "Username and email are required" });
        return;
      }

      const newMessage = new Message({ 
        username: username.trim(), 
        email: email.trim().toLowerCase(), 
        message: message.trim(),
        content: message.trim(), // Set both for compatibility
        messageType: domainId ? 'domain' : 'global',
        domainId: domainId || null,
        timestamp: new Date()
      });
      
      const savedMessage = await newMessage.save();
      console.log("Global message saved successfully:", savedMessage._id);
      
      // Format message for broadcast
      const broadcastMessage = {
        _id: savedMessage._id,
        username: savedMessage.username,
        email: savedMessage.email,
        message: savedMessage.message,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
        messageType: savedMessage.messageType || 'global',
        userId: savedMessage.userId
      };
      
      // Broadcast message to all clients for global chat
      if (!domainId) {
        console.log("Broadcasting global message to all clients");
        io.emit("receiveMessage", broadcastMessage);
      } else {
        // Broadcast to domain room
        console.log(`Broadcasting domain message to domain_${domainId}`);
        io.to(`domain_${domainId}`).emit("receiveDomainMessage", broadcastMessage);
      }
    } catch (error) {
      console.error("Error saving global message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Join domain-specific room for domain chat
  socket.on("joinDomain", (domainId) => {
    if (domainId) {
      socket.join(`domain_${domainId}`);
      console.log(`User ${socket.id} joined domain ${domainId}`);
    }
  });

  // Handle domain-specific message
  socket.on("sendDomainMessage", async ({ username, email, message, domainId }) => {
    try {
      console.log("Received domain message:", { username, email, message: message?.substring(0, 50), domainId });
      
      if (!message || message.trim() === '') {
        socket.emit("messageError", { error: "Message cannot be empty" });
        return;
      }

      if (!username || !email) {
        socket.emit("messageError", { error: "Username and email are required" });
        return;
      }

      if (!domainId) {
        socket.emit("messageError", { error: "Domain ID is required for domain messages" });
        return;
      }
      
      const newMessage = new Message({ 
        username: username.trim(), 
        email: email.trim().toLowerCase(), 
        message: message.trim(),
        content: message.trim(),
        messageType: 'domain',
        domainId,
        timestamp: new Date()
      });
      
      const savedMessage = await newMessage.save();
      console.log("Domain message saved successfully:", savedMessage._id);
      
      // Format message for broadcast
      const broadcastMessage = {
        _id: savedMessage._id,
        username: savedMessage.username,
        email: savedMessage.email,
        message: savedMessage.message,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
        messageType: savedMessage.messageType,
        domainId: savedMessage.domainId,
        userId: savedMessage.userId
      };
      
      // Broadcast to domain room
      io.to(`domain_${domainId}`).emit("receiveDomainMessage", broadcastMessage);
    } catch (error) {
      console.error("Error saving domain message:", error);
      socket.emit("messageError", { error: "Failed to send domain message" });
    }
  });

  // Handle getting domain messages
  socket.on("getDomainMessages", async (domainId) => {
    try {
      if (!domainId) {
        console.log("No domain ID provided for getDomainMessages");
        socket.emit("domainChatHistory", []);
        return;
      }

      console.log("Fetching domain messages for domain:", domainId);
      
      const messages = await Message.find({ 
        messageType: 'domain', 
        domainId,
        isDeleted: { $ne: true },
        status: { $ne: 'flagged' }
      })
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(100)
      .populate('userId', 'username fullName profileImage')
      .lean();
      
      console.log(`Found ${messages.length} domain messages for domain ${domainId}`);
      
      // Format messages for frontend
      const formattedMessages = messages.map(msg => ({
        _id: msg._id,
        username: msg.username,
        email: msg.email,
        message: msg.message || msg.content,
        content: msg.content || msg.message,
        timestamp: msg.timestamp || msg.createdAt,
        messageType: msg.messageType,
        domainId: msg.domainId,
        userId: msg.userId
      }));
      
      socket.emit("domainChatHistory", formattedMessages.reverse());
    } catch (error) {
      console.error("Error fetching domain chat history:", error);
      socket.emit("domainChatHistory", []);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("👤 User disconnected:", socket.id);
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error("Socket error for user", socket.id, ":", error);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/chat", chatRoutes);

// Legacy routes for compatibility
app.use("/", domainRoutes);
app.use("/", ideaRoutes);
app.use("/", authorRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// ✅ FIXED: Add a test endpoint to verify uploads work
app.get("/api/test-uploads", (req, res) => {
  const uploadsPath = path.join(__dirname, "uploads");
  
  try {
    const stats = fs.statSync(uploadsPath);
    const files = fs.readdirSync(uploadsPath, { recursive: true });
    
    res.json({
      success: true,
      uploadsPath,
      exists: stats.isDirectory(),
      fileCount: files.length,
      sampleFiles: files.slice(0, 10)
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      uploadsPath
    });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use(errorHandler);

// Global error handler
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Socket.IO server ready for connections`);
  console.log(`📁 Static files served from: ${path.join(__dirname, "uploads")}`);
});