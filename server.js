"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const fetch = require("isomorphic-fetch");

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.static(path.join(__dirname, "build")));

app.get("/api/expanded", (req, res) => {
  const url = `http://www.dr.dk/mu/programcard/expanded?id=${req.query.slug}`
  fetch(url)
    .then(resp => resp.json())
    .then(data => res.send(data));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(process.env.PORT || 8080);
