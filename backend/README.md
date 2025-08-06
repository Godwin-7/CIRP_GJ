# CIRP - Collaborative Platform for Scientific Ideas and Research

A comprehensive web platform that enables researchers, students, and professionals to share, collaborate, and develop scientific ideas across various domains.

## 🌟 Features

### Core Features
- **Domain Management**: Organize ideas by scientific domains with difficulty levels (Easy, Medium, Hard)
- **Idea Sharing**: Submit detailed project ideas with descriptions, images, PDFs, and research papers
- **Author Profiles**: Complete author management with contact information, expertise, and privacy settings
- **Collaboration System**: Express interest in collaborating on ideas and connect with like-minded researchers
- **Comment System**: Threaded commenting with replies, likes, and moderation features
- **Real-time Chat**: Global and domain-specific chat rooms for community interaction
- **Search & Discovery**: Advanced search across ideas, domains, and authors
- **User Authentication**: Secure registration, login, and profile management

### Advanced Features
- **Project Details Section**: Comprehensive project information including:
  - Project title and description
  - Project images (main + additional)
  - Related links and research papers
  - PDF documentation
  - Publication date and collaboration interests
- **Author Information**: Detailed author profiles with:
  - Contact information (email, phone)
  - Profile pictures (optional with defaults)
  - Professional details and expertise
- **Interactive Comments**: Full-featured comment system with:
  - Threaded replies
  - Like/unlike functionality
  - User identification and timestamps
  - Moderation capabilities

## 🏗️ Architecture

### Backend Stack
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

### Database Models
- **User**: Authentication and profile management
- **Domain**: Scientific domains with topic categorization
- **Idea**: Detailed project ideas with rich metadata
- **Author**: Author profiles with professional information
- **Comment**: Threaded comment system
- **Message**: Real-time chat system

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/cirp-backend.git
cd cirp-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://csundar993:S1RjXYDtC73UGJCE@cluster2.3g8fa.mongodb.net/cirp
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

4. **Create upload directories**
```bash
mkdir -p uploads/domains uploads/ideas uploads/authors uploads/pdfs uploads/defaults
```

5. **Seed the database** (Optional)
```bash
node scripts/seedData.js
```

6. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── controllers/           # Route handlers
│   ├── authController.js     # Authentication logic
│   ├── domainController.js   # Domain management
│   ├── ideaController.js     # Idea CRUD operations
│   ├── authorController.js   # Author management
│   └── commentController.js  # Comment system
├── models/               # Database schemas
│   ├── User.js              # User model
│   ├── Domain.js            # Domain model
│   ├── Idea.js              # Idea model with rich features
│   ├── Author.js            # Enhanced author model
│   ├── Comment.js           # Threaded comment system
│   └── Message.js           # Chat system
├── routes/               # API route definitions
│   ├── auth.js              # Authentication routes
│   ├── domains.js           # Domain routes
│   ├── ideas.js             # Idea routes
│   ├── authors.js           # Author routes
│   ├── comments.js          # Comment routes
│   └── chat.js              # Chat routes
├── middleware/           # Custom middleware
│   ├── auth.js              # Authentication middleware
│   ├── upload.js            # File upload handling
│   └── validation.js        # Input validation
├── uploads/              # File storage
│   ├── domains/             # Domain images
│   ├── ideas/               # Project images
│   ├── authors/             # Author profile pictures
│   ├── pdfs/                # Project documents
│   └── defaults/            # Default images
├── utils/                # Utility functions
│   └── database.js          # Database connection
├── scripts/              # Utility scripts
│   └── seedData.js          # Database seeding
├── server.js             # Main server file
├── package.json          # Dependencies
└── README.md            # This file
```

## 🔧 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Domain Endpoints

#### Get All Domains
```http
GET /api/domains?page=1&limit=20
```

#### Create Domain
```http
POST /api/domains
Authorization: Bearer <token>
Content-Type: multipart/form-data

title=Artificial Intelligence
description=AI and ML research
image=<file>
topics={"easy":["Basic AI"],"medium":["ML Algorithms"],"hard":["Deep Learning"]}
```

#### Get Domain by ID
```http
GET /api/domains/:domainId
```

### Idea Endpoints

#### Get All Ideas
```http
GET /api/ideas?domain=<domainId>&difficulty=medium&page=1&limit=20
```

#### Create Idea
```http
POST /api/ideas
Authorization: Bearer <token>
Content-Type: multipart/form-data

title=Smart AI Assistant
description=An intelligent assistant for researchers
domainId=<domain-id>
authorId=<author-id>
difficulty=medium
projectImage=<file>
projectPdf=<file>
```

#### Get Idea Details
```http
GET /api/ideas/:ideaId
```

#### Like/Unlike Idea
```http
POST /api/ideas/:ideaId/like
Authorization: Bearer <token>
```

#### Express Collaboration Interest
```http
POST /api/ideas/:ideaId/collaborate
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "I'm interested in collaborating on this project",
  "skills": ["Python", "Machine Learning"]
}
```

### Author Endpoints

#### Get All Authors
```http
GET /api/authors?page=1&limit=20
```

#### Create Author
```http
POST /api/authors
Authorization: Bearer <token>
Content-Type: multipart/form-data

authorName=Dr. Jane Smith
authorEmail=jane@research.edu
bio=AI researcher with 10 years experience
profileImage=<file>
```

#### Get Author by Topic
```http
GET /api/authors/topic/machine-learning
```

### Comment Endpoints

#### Get Comments for Idea
```http
GET /api/comments/idea/:ideaId?page=1&limit=20
```

#### Create Comment
```http
POST /api/comments/idea/:ideaId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great idea! I have some suggestions..."
}
```

#### Reply to Comment
```http
POST /api/comments/idea/:ideaId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Thanks for the feedback!",
  "parentCommentId": "<parent-comment-id>"
}
```

#### Like Comment
```http
POST /api/comments/:commentId/like
Authorization: Bearer <token>
```

### Chat Endpoints

#### Get Global Chat Messages
```http
GET /api/chat/global?page=1&limit=50
```

#### Get Domain Chat Messages
```http
GET /api/chat/domain/:domainId?page=1&limit=50
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📝 Database Schema

### User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  fullName: String,
  profileImage: String,
  bio: String,
  phone: String,
  isAdmin: Boolean,
  collaborationInterests: [ObjectId],
  following: [ObjectId],
  followers: [ObjectId]
}
```

### Domain Model
```javascript
{
  title: String (unique),
  imageUrl: String,
  description: String,
  topics: {
    easy: [String],
    medium: [String],
    hard: [String]
  },
  category: String,
  tags: [String],
  createdBy: ObjectId,
  stats: {
    totalIdeas: Number,
    totalViews: Number
  }
}
```

### Idea Model (Enhanced)
```javascript
{
  title: String,
  description: String,
  domain: ObjectId,
  author: ObjectId,
  createdBy: ObjectId,
  
  // Project Details
  projectImage: String,
  additionalImages: [{
    url: String,
    caption: String
  }],
  relatedLinks: [{
    title: String,
    url: String,
    type: String
  }],
  researchPapers: [Object],
  projectPdf: {
    filename: String,
    path: String,
    size: Number
  },
  
  // Collaboration
  likes: [{
    user: ObjectId,
    likedAt: Date
  }],
  collaborationInterests: [{
    user: ObjectId,
    message: String,
    skills: [String],
    status: String
  }],
  
  // Metadata
  difficulty: String,
  status: String,
  tags: [String],
  stats: {
    totalViews: Number,
    totalLikes: Number,
    totalComments: Number
  }
}
```

### Author Model (Enhanced)
```javascript
{
  authorName: String,
  authorEmail: String (unique),
  phone: String,
  profileImage: String,
  bio: String,
  
  // Professional Info
  title: String,
  organization: String,
  department: String,
  
  // Contact Info
  contactInfo: {
    email: String,
    phone: String,
    website: String,
    linkedin: String
  },
  
  // Research Areas
  researchAreas: [String],
  expertise: [{
    skill: String,
    level: String,
    yearsOfExperience: Number
  }],
  
  // Privacy Settings
  privacy: {
    showEmail: Boolean,
    showPhone: Boolean,
    allowDirectContact: Boolean
  },
  
  topics: [String],
  ideas: [ObjectId],
  isVerified: Boolean
}
```

### Comment Model
```javascript
{
  content: String,
  author: ObjectId,
  targetType: String, // 'idea', 'domain'
  targetId: ObjectId,
  parentComment: ObjectId, // for replies
  replies: [ObjectId],
  threadLevel: Number,
  likes: [{
    user: ObjectId,
    likedAt: Date
  }],
  isEdited: Boolean,
  status: String
}
```

## 🔄 Real-time Features

The application uses Socket.IO for real-time communication:

### Global Chat
- Connect to global chat room
- Send/receive messages in real-time
- Message history and pagination

### Domain-specific Chat
- Join domain-specific chat rooms
- Discuss topics related to specific domains
- Separate message streams per domain

### Socket Events
```javascript
// Client to Server
socket.emit('sendMessage', { username, email, message, domainId });
socket.emit('joinDomain', domainId);

// Server to Client
socket.on('receiveMessage', (message) => { /* handle message */ });
socket.on