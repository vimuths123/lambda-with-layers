const express = require("express");
const multer  = require("multer");
const ffmpeg  = require("fluent-ffmpeg");
const serverless = require("serverless-http");
const path    = require("path");
const fs      = require("fs");

const app = express();

// Tell ffmpeg where to find the binary in Lambda
ffmpeg.setFfmpegPath("/opt/bin/ffmpeg");

app.use(express.static("public"));

// Use /tmp for Lambda
const upload = multer({ dest: "/tmp/" });

app.post("/thumbnail", upload.single("video"), (req, res) => {

  const videoPath     = req.file.path;
  const thumbnailPath = `/tmp/thumb_${Date.now()}.png`;

  ffmpeg(videoPath)
    .screenshots({
      timestamps: [1],
      filename: path.basename(thumbnailPath),
      folder: "/tmp",
      size: "320x180"
    })
    .on("end", () => {
      res.sendFile(thumbnailPath, () => {
        fs.unlinkSync(videoPath);
        fs.unlinkSync(thumbnailPath);
        console.log("Temp files deleted ✅");
      });
    })
    .on("error", (err) => {
      fs.unlinkSync(videoPath);
      res.status(500).send("Error: " + err.message);
    });

});

// For localhost testing
// app.listen(3000, () => {
//   console.log("Server running on http://localhost:3000");
// });

// Lambda handler
module.exports.handler = serverless(app);