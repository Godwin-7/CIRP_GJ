const express = require("express");
const mongoose = require("mongoose");
const domain = require("./models/Domain");
const cors = require("cors");
const domainRoutes = require("./routes/domainRoutes");
const topicRoutes = require("./routes/topicRoutes");
const fs = require("fs");
const path = require("path");
const multer = require("multer");


const app = express();
const PORT = 5000||5001;

mongoose.connect('mongodb+srv://csundar993:S1RjXYDtC73UGJCE@cluster2.3g8fa.mongodb.net/cirp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());

app.use("/api/domains", domainRoutes);
app.use("/api/topics", topicRoutes);

app.use("/assets", express.static(path.join(__dirname, "../frontend/src/assets")));

const uploadDir = path.join(__dirname, "../frontend/src/assets");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

const upload = multer({ storage });



app.post('/domainform', upload.single('image'), async (req, res) => {
  const { title, description, topics } = req.body;
  const imageurl = req.file ? `assets/${req.file.filename}` : null;

  if (!topics || !Array.isArray(JSON.parse(topics).easy) || 
      !Array.isArray(JSON.parse(topics).medium) || 
      !Array.isArray(JSON.parse(topics).hard)) {
    return res.status(400).json({ error: 'Topics must be an object with easy, medium, and hard arrays.' });
  }

  const dom = new domain({
    title,
    imageurl,
    description,
    topics: JSON.parse(topics),
  });

  try {
    const savedDomain = await dom.save();
    res.status(201).json(savedDomain);
  } catch (err) {
    res.status(400).json({ error: 'Error saving data', message: err.message });
  }
});



app.get('/domains',async(req,res)=>{

  try{
      const dom = await domain.find();
      res.status(200).json(dom);
  }catch(err)
  {
    res.status(400).json(err);
  }


});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
