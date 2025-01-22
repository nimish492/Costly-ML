const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { spawn } = require("child_process"); // Changed from PythonShell to spawn
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const { promisify } = require("util");

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the "public" folder (or your frontend folder)
app.use(express.static(path.join(__dirname, "public")));
// Serve static files (like images) from the 'images' directory
app.use("/images", express.static(path.join(__dirname, "images")));

// Handle any other requests (e.g., routes for API calls)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

// Function to process the Python recommendation
async function processRecommendation(savePath) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      "./ResNet50_model/main.py",
      savePath,
    ]);

    let data = ""; // Initialize variable to collect Python output

    pythonProcess.stdout.on("data", (chunk) => {
      data += chunk; // Accumulate data as it's received
    });

    pythonProcess.stderr.on("data", (err) => {
      console.error(`stderr: ${err.toString()}`);
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const recommendedProducts = JSON.parse(data); // Parse the response from the Python script
          resolve(recommendedProducts);
        } catch (error) {
          reject(new Error("Failed to parse Python response"));
        }
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

// API route to handle product recommendations
app.post("/recommend", async (req, res) => {
  console.log("Received a request for recommendations...");
  const uploadedFileUrl = req.body.uploadedFileUrl;
  console.log(`Processing image URL: ${uploadedFileUrl}`);

  // Assuming the image URL points to the asset folder, we get the file name
  const imagePath = path.join(
    __dirname,
    "public",
    "assets",
    uploadedFileUrl.split("/").pop()
  );

  try {
    const recommendedProducts = await processRecommendation(imagePath);
    res.json({
      message: "Recommendation successful",
      recommendedProducts,
    });
  } catch (error) {
    console.error("Recommendation failed:", error.message);
    res.status(500).json({
      message: "Failed to generate recommendations",
      error: error.message,
    });
  }
});

app.post("/recommend-frequently", (req, res) => {
  const cartData = req.body.cartData; // Items in the current cart
  console.log("Cart data:", cartData);
  const transactionData = [
    [1, 9],
    [1, 15],
    [1, 15],
    [1, 15],
    [1, 15],
    [1, 15],
    [1, 15],
    [1, 15],
    [18, 13],
    [2, 34],
    [5, 24],
    [12, 26],
    [19, 34],
    [32, 22],
    [1, 10],
    [1, 15],
    [3, 7],
    [3, 9],
    [4, 17],
    [6, 7],
    [6, 13],
    [8, 23],
    [9, 10],
    [9, 15],
    [11, 16],
    [14, 21],
    [15, 24],
    [16, 31],
    [17, 23],
    [20, 36],
    [21, 25],
    [22, 34],
    [23, 30],
    [24, 36],
    [25, 33],
    [26, 39],
    [27, 28],
    [29, 37],
    [33, 40],
    [34, 38],
    [35, 37],
    [36, 37],
    [40, 25],
    [1, 9],
    [18, 13],
    [2, 34],
    [5, 24],
    [12, 26],
    [19, 34],
    [32, 22],
    [1, 10],
    [1, 15],
    [3, 7],
    [3, 9],
    [4, 17],
    [6, 7],
    [6, 13],
    [8, 23],
    [9, 10],
    [9, 15],
    [11, 16],
    [14, 21],
    [15, 24],
    [16, 31],
    [17, 23],
    [20, 36],
    [21, 25],
    [22, 34],
    [23, 30],
    [24, 36],
    [25, 33],
    [26, 39],
    [27, 28],
    [29, 37],
    [33, 40],
    [34, 38],
    [35, 37],
    [36, 37],
    [40, 25],
    [1, 9],
    [18, 13],
    [2, 34],
    [5, 24],
    [12, 26],
    [19, 34],
    [32, 22],
    [1, 10],
    [1, 15],
    [3, 7],
    [3, 9],
    [4, 17],
    [6, 7],
    [6, 13],
    [8, 23],
    [9, 10],
    [9, 15],
    [11, 16],
    [14, 21],
    [15, 24],
    [16, 31],
    [17, 23],
    [20, 36],
    [21, 25],
    [22, 34],
    [23, 30],
    [24, 36],
    [25, 33],
    [26, 39],
    [27, 28],
    [29, 37],
    [33, 40],
    [34, 38],
    [35, 37],
    [36, 37],
    [40, 25],
  ];

  const data = {
    cart_data: cartData,
    transaction_data: transactionData,
  };

  const pythonProcess = spawn("python", ["./apriori_algo/apriori.py"]);

  pythonProcess.stdin.write(JSON.stringify(data));
  pythonProcess.stdin.end();

  pythonProcess.stdout.on("data", (data) => {
    try {
      const recommendations = JSON.parse(data.toString());
      console.log("Recommendations from Python script:", recommendations);
      res.json(recommendations);
    } catch (error) {
      console.error("Error parsing Python response:", error);
      res.status(500).json({
        message: "Error processing recommendations",
        error: error.message,
      });
    }
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Error in Python script:", data.toString());
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
