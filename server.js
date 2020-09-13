"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var dns = require("dns");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;
console.log(Math.floor(Math.random() * 1000));

/** this project needs a db !! **/
//mongoose.connect(process.env.DB_URI);
process.env.MONGO_URI =
  "mongodb+srv://sibra:161996ss@cluster0.kx9pj.mongodb.net/<dbname>?retryWrites=true&w=majority";

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(cors());

const { Schema } = mongoose;

const urlSchema = new Schema({
  urlIndex: Number,
  url: String,
});
var Url = mongoose.model("Url", urlSchema);
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});
var findUrlbyindex = async (urlIndex) => {
  const rg = await Url.find({ urlIndex });
  return rg[0].url;
};
var createAndSaveUrl = async (url, urlIndex) => {
  var rs = await Url.find({ url });
  if (rs.length == 0) {
    console.log(urlIndex);
    var urli = new Url({ url, urlIndex });
    var res = await urli.save();
    return { urlIndex, url };
  }
  return { urlIndex: rs[0].urlIndex, url };
};

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});
var bodyParser = require("body-parser");
var pattern = new RegExp(
  "^(https?:\\/\\/)" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + //port
    "(\\?[;&amp;a-z\\d%_.~+=-]*)?" + // query string
    "(\\#[-a-z\\d_]*)?$",
  "i"
);
app.use(bodyParser.urlencoded({ extended: false }));
app.post(
  "/api/shorturl/new",
  function (req, res, next) {
    // Handle the data in the request
    var url = req.body.url;

    var sourceString = url
      .replace("http://", "")
      .replace("https://", "")
      .replace("www.", "")
      .split(/[/?#]/)[0];
    dns.lookup(sourceString, function (err) {
      console.log(err);
      console.log();
      if (!err && pattern.test(url)) next();
      else res.json({ error: "Invalid URL" });
    });
  },
  function (req, res) {
    var urlIndex = Math.floor(Math.random() * 100);
    var url = req.body.url;
    createAndSaveUrl(url, urlIndex).then(({ url, urlIndex }) => {
      res.json({ original_url: url, short_url: urlIndex });
    });
  }
);

app.get("/api/shorturl/:nb", function (req, res) {
  // Handle the data in the request
  findUrlbyindex(req.params.nb).then((url) => {
    res.statusCode = 302;
    res.setHeader("Location", url);
    res.end();
  });
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
