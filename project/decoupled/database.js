// Import the mongoose library for MongoDB connection
const mongoose = require("mongoose");

// Function to connect to the specified type of database
function connectToDatabase(dbType) {
  // Check if the specified database type is MongoDB
  if (dbType === "mongo") {
    // Log that MongoDB is being used
    console.log("Using MongoDB");

    // Connect to MongoDB using the provided connection string
    mongoose.connect(
      "mongodb+srv://mayureshngorantiwar:4pH5dvC4d7XRUe8O@cluster0.sdnavtq.mongodb.net/ecoomerce_db"
    );

    // Get the connection instance and handle errors
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
  } else if (dbType === "json") {
    // If the specified type is JSON, log that JSON database is being used
    console.log("Using JSON database");
  }
}

// Export the connectToDatabase function for use in other modules
module.exports = { connectToDatabase };
