const express = require("express");
const mongoose = require("mongoose");
const domain = require("./models/Domain");
const cors = require("cors");
const domainRoutes = require("./routes/domainRoutes");
const topicRoutes = require("./routes/topicRoutes");

const app = express();
const PORT = 5000||5001;

mongoose.connect('mongodb+srv://csundar993:S1RjXYDtC73UGJCE@cluster2.3g8fa.mongodb.net/cirp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/domains", domainRoutes);
app.use("/api/topics", topicRoutes);

app.post('/domainform',async(req,res)=>{
  const{title,imageurl,description,topics} = req.body;

  const dom = new domain({
          title,
          imageurl,
          description,
          topics,
         })
  try{
          const saveddomain = await dom.save();

          res.status(201).json(saveddomain);
  }catch(err)
  {
    res.status(400).json('error saving data',err.message);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
