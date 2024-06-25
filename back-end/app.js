const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const feedRoutes = require("./routes/feed");
const authRoutes = require('./routes/auth');
const multer = require("multer");
require('dotenv').config()
const app = express();
mongoose.set('strictQuery', false);

const port = process.env.PORT || 8080;
const databaseUrl=process.env.DATABASE_URL;


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/') // change the destination folder as per your requirement
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg')
  }
})

const fileFilter = function (req, file, cb) {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  }
  else {
    cb(new Error('File type not supported!'), false);
  }
};


const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// app.use(bodyParser.urlencoded()); // x-www-from-urlencoded <form>

app.use(bodyParser.json()); // application/json
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(upload.single('image'));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});

mongoose
  .connect(databaseUrl)
  .then((result) => {
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
