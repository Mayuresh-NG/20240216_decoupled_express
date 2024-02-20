const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());


// Middleware to parse JSON in the request body
app.use(bodyParser.json());

// Read products data from the external JSON file
const productsData = JSON.parse(fs.readFileSync("products.json", "utf8"));
const orderData = JSON.parse(fs.readFileSync("order.json", "utf8"));

// For searching items in the database
app.get("/api/search", (req, res) => {
  // Extract searchParam from query parameters
  const searchParam = req.query.searchParam;

  // Check if searchParam is missing
  if (!searchParam) {
    return res
      .status(400)
      .json({ error: "Missing searchParam in the request body" });
  }

  // Find product with the specified productName
  const product = productsData.find(
    (p) => p.productName.toLowerCase() === searchParam.toLowerCase()
  );

  // Respond based on whether the product is found
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// For updating stock and creating a new order
app.put("/api/search", (req, res) => {
  // Extract id and quantity from query parameters
  const checkoutid = req.query.id;
  const checkoutquantity = req.query.quantity;

  // Check if id or quantity is missing
  if (!checkoutid || !checkoutquantity) {
    return res.status(400).json({
      error: "Missing id or quantity in the request query parameters",
    });
  }

  // Find the index of the product with the given id
  const productIndex = productsData.findIndex(
    (p) => p.productId === parseInt(checkoutid, 10)
  );

  // Respond based on whether the product is found
  if (productIndex !== -1) {
    // Update the stock of the product with the given id
    productsData[productIndex].stock -= parseInt(checkoutquantity, 10);

    // Write the updated product data back to the external JSON file
    fs.writeFileSync(
      "products.json",
      JSON.stringify(productsData, null, 2),
      "utf8"
    );

    // Create a new order object
    let newOrder = {
      O_ID: "", // Use a function to generate a unique ID
      O_Address: "Sample Address", // Add the actual address details
      O_P_ID: checkoutid,
      O_status: "Pending", // Set the initial status
      O_totalcost: checkoutquantity * productsData[productIndex].price,
      order_quantity: checkoutquantity,
    };

    // Add the new order object to the orderData array
    orderData.push(newOrder);

    // Write the updated array back to order.json
    fs.writeFileSync("order.json", JSON.stringify(orderData, null, 2), "utf8");

    // Respond with success and updated data
    res.json({
      success: "Stock and order updated successfully",
      updatedProduct: productsData[productIndex],
      newOrder,
    });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// For adding a new product
app.post("/api", (req, res) => {
  // Extract new product details from the request body
  const newProduct = req.body;

  // Check if required fields are missing
  if (
    !newProduct ||
    !newProduct.productId ||
    !newProduct.productName ||
    !newProduct.price ||
    !newProduct.stock ||
    !newProduct.imageUrl
  ) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Check if a product with the same productId already exists
  const existingProduct = productsData.find(
    (p) => p.productId === newProduct.productId
  );

  // Respond based on whether the product with the same productId already exists
  if (existingProduct) {
    return res
      .status(400)
      .json({ error: "Product with the same productId already exists" });
  }

  // Add the new product to the productsData array
  productsData.push(newProduct);

  // Write the updated data back to the external JSON file
  fs.writeFileSync(
    "products.json",
    JSON.stringify(productsData, null, 2),
    "utf8"
  );

  // Respond with success and new product details
  res.json({ success: "Product added successfully", newProduct });
});

// For updating stock of a product by id
app.put("/api/id", (req, res) => {
  // Extract id and quantity from query parameters
  const checkoutid = req.query.id;
  const checkoutquantity = req.query.quantity;

  // Check if id or quantity is missing
  if (!checkoutid || !checkoutquantity) {
    return res.status(400).json({
      error: "Missing id or quantity in the request query parameters",
    });
  }

  // Find the index of the product with the given id
  const productIndex = productsData.findIndex(
    (p) => p.productId === parseInt(checkoutid, 10)
  );

  // Respond based on whether the product is found
  if (productIndex !== -1) {
    // Update the stock of the product with the given id
    productsData[productIndex].stock = parseInt(checkoutquantity, 10);

    // Write the updated product data back to the external JSON file
    fs.writeFileSync(
      "products.json",
      JSON.stringify(productsData, null, 2),
      "utf8"
    );

    // Respond with success and updated product details
    res.json({
      success: "Stock updated successfully",
      updatedProduct: productsData[productIndex],
    });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// For deleting a product by id
app.delete("/api/id", (req, res) => {
  // Extract id from query parameters
  const toDelete = parseInt(req.query.id, 10);

  // Check if id is invalid
  if (isNaN(toDelete)) {
    return res.status(400).json({ error: "Invalid id parameter" });
  }

  // Find the index of the product with the given ID
  const productIndex = productsData.findIndex((p) => p.productId === toDelete);

  // Respond based on whether the product is found
  if (productIndex !== -1) {
    // Remove the product from the productsData array
    productsData.splice(productIndex, 1);

    // Write the updated data back to the external JSON file
    fs.writeFileSync(
      "products.json",
      JSON.stringify(productsData, null, 2),
      "utf8"
    );

    // Respond with success
    res.json({ success: "Product deleted successfully" });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// For updating order details (e.g., address)
app.post("/api/order", (req, res) => {
  // Extract id and address from query parameters
  let checkoutid = req.query.id;
  let address = req.query.address;

  // Find the index of the order with the given O_P_ID
  const orderIndex = orderData.findIndex(
    (p) => p.O_P_ID == parseInt(checkoutid, 10)
  );

  // Respond based on whether the order is found
  if (orderIndex !== -1) {
    // Update order details
    orderData[orderIndex].O_Address = address;
    orderData[orderIndex].O_status = "pending";
    orderData[orderIndex].O_ID = uuidv4();

    // Write the updated data back to the external JSON file
    fs.writeFileSync("order.json", JSON.stringify(orderData, null, 2), "utf8");

    // Respond with success and updated order details
    res.json({
      success: "Order updated successfully",
      updatedProduct: orderData[orderIndex],
    });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// Get product details through product id
app.get("/api/details", (req, res) => {
  // Extract id from query parameters
  let id = req.query.id;

  // Find the product with the specified productId
  const product = productsData.find((p) => p.productId == id);

  // Respond based on whether the product is found
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// Get status of an order (e.g., whether it's pending)
app.get("/api/status", (req, res) => {
  // Extract orderid from query parameters
  let orderid = req.query.orderid;

  // Find the index of the order with the given O_ID
  const orderIndex = orderData.findIndex((p) => p.O_ID == orderid);

  // Respond based on whether the order is found
  if (orderIndex !== -1) {
    res.json(orderData[orderIndex].O_status);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// Cancel an order
app.delete("/api/cancel", (req, res) => {
  // Extract cancelid from query parameters
  const toDelete = req.query.cancelid;

  // Find the index of the order with the given O_ID
  const orderIndex = orderData.findIndex((order) => order.O_ID == toDelete);

  // Respond based on whether the order is found
  if (orderIndex !== -1) {
    // Retrieve the order quantity and the corresponding product ID
    const updatedQuant = orderData[orderIndex].order_quantity;
    const productId = orderData[orderIndex].O_P_ID;

    // Find the index of the product with the given productId
    const productIndex = productsData.findIndex(
      (product) => product.productId == productId
    );

    // Respond based on whether the product is found
    if (productIndex !== -1) {
      // Update the stock of the product with the given productId
      productsData[productIndex].stock += parseInt(updatedQuant, 10);

      // Write the updated product data back to the external JSON file
      fs.writeFileSync(
        "products.json",
        JSON.stringify(productsData, null, 2),
        "utf8"
      );

      // Remove the order from the orderData array
      orderData.splice(orderIndex, 1);

      // Write the updated order data back to the external JSON file
      fs.writeFileSync(
        "order.json",
        JSON.stringify(orderData, null, 2),
        "utf8"
      );

      // Respond with success
      res.json({ success: "Order deleted successfully" });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
