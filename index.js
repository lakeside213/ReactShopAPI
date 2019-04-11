const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const keys = require("./config/dev");

mongoose.connect(
  keys.MONGO_URI,
  { useNewUrlParser: true }
);
app.use(bodyParser.json({ type: "*/*" }));
app.use(cors());
require("./routes/authRoutes")(app);
require("./routes/mailerRoutes")(app);

const port = process.env.PORT || 5000;
const server = http.createServer(app);
server.listen(port);
console.log("server listening on " + port);
