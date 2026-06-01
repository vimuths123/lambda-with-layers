const express = require("express");
const multer  = require("multer");
const ffmpeg  = require("fluent-ffmpeg");
const serverless = require("serverless-http");
const path    = require("path");
const fs      = require("fs");

const app = express();

app.use(express.static("public"));

// Save uploaded video to temp folder
const upload = multer({ dest: "temp/" });

app.post("/thumbnail", upload.single("video"), (req, res) => {

  const videoPath     = req.file.path;                        // uploaded video
  const thumbnailPath = `temp/thumb_${Date.now()}.png`;      // thumbnail path

  ffmpeg(videoPath)
    .screenshots({
      timestamps: [1],
      filename: path.basename(thumbnailPath),
      folder: "temp",
      size: "320x180"
    })
    .on("end", () => {

      // Send thumbnail to user
      res.sendFile(path.resolve(thumbnailPath), () => {

        // After sending, delete both files
        fs.unlinkSync(videoPath);
        fs.unlinkSync(thumbnailPath);
        console.log("Temp files deleted ✅");

      });

    })
    .on("error", (err) => {
      // Cleanup on error too
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