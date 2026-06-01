const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const serverless = require("serverless-http");
const path = require("path");
const fs = require("fs");

const app = express();

// Tell ffmpeg where to find the binary in Lambda
ffmpeg.setFfmpegPath("/opt/bin/ffmpeg");

app.use(express.static(path.join(__dirname, "public")));

// Use /tmp for Lambda
const upload = multer({ dest: "/tmp/" });

app.post("/thumbnail", upload.single("video"), (req, res) => {

  const videoPath = req.file.path;
  const thumbnailPath = `/tmp/thumb_${Date.now()}.png`;

  ffmpeg(videoPath)
    .screenshots({
      timestamps: [1],
      filename: path.basename(thumbnailPath),
      folder: "/tmp",
      size: "320x180"
    })
    .on("end", () => {
      console.log("ffmpeg done, thumbnail path:", thumbnailPath);
      console.log("file exists?", fs.existsSync(thumbnailPath));

      const imageBuffer = fs.readFileSync(thumbnailPath);
      const base64Image = imageBuffer.toString("base64");

      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
      console.log("Temp files deleted ✅");

      res.send(`
    <html>
      <body style="background:black; display:flex; justify-content:center; align-items:center; height:100vh;">
        <img src="data:image/png;base64,${base64Image}" />
      </body>
    </html>
  `);
    })
    .on("error", (err) => {
      console.log("ffmpeg error:", err.message);
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      res.status(500).send("Error: " + err.message);
    });

});

// For localhost testing
// app.listen(3000, () => {
//   console.log("Server running on http://localhost:3000");
// });

// Lambda handler
module.exports.handler = serverless(app);