const express = require("express");
const fs = require("fs");
const path = require("path");
const Fuse = require("fuse.js");
const app = express();
const port = 3000;

// Middleware to handle CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Middleware to parse JSON bodies
app.use(express.json());

// Path to the data file
const dataFilePath = path.join(__dirname, "data.json");

// Read data from file
const readData = () => {
  try {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading data file:", error);
    return [];
  }
};

// Write data to file
const writeData = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing data file:", error);
  }
};

// Initialize Fuse.js for searching
const initializeFuse = (data) => {
  const options = {
    keys: ["domain", "apptitle", "appdescription", "by"],
    includeScore: true,
    threshold: 0.3, // Adjust this value for fuzziness
  };
  return new Fuse(data, options);
};

// Search endpoint
app.get("/s", (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  const data = readData();
  const fuse = initializeFuse(data);

  // Perform search
  const results = fuse.search(query).map((result) => result.item);

  // Enhance results with additional information if needed
  results.forEach((item) => {
    item.similarity = item.apptitle.toLowerCase().includes(query.toLowerCase())
      ? "high"
      : "low";
  });

  res.json(results);
});

// Add endpoint
app.post("/add", (req, res) => {
  const { domain, apptitle, appdescription, by, cortype, icon } = req.body;
  if (!domain || !apptitle || !appdescription) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const data = readData();
  const newItem = {
    id: data.length + 1,
    domain,
    apptitle,
    appdescription,
    by: by || "unknown",
    cortype: "https://",
    icon: icon || extractIconFromDomain(domain),
  };

  data.push(newItem);
  writeData(data);

  res.json({ message: "Data added successfully", item: newItem });
});

// Extract icon from domain (Placeholder logic for demo purposes)
const extractIconFromDomain = (domain) => {
  const defaultIcon = "https://via.placeholder.com/16"; // Fallback icon
  try {
    // Placeholder logic for demo purposes
    return `https://www.google.com/s2/favicons?domain=${domain}`;
  } catch (error) {
    console.error("Error extracting icon:", error);
    return defaultIcon;
  }
};

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
