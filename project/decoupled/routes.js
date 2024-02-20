const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

// mongo imports
const Model = require("./schema/schema.js");

function handleMongoRoutes(app) {
  app.use(bodyParser.json());
  app.get("/api/search", async (req, res) => {
    try {
      // Extract searchParam from query parameters
      const searchParam = req.query.searchParam;

      // Check if searchParam is missing
      if (!searchParam) {
        return res
          .status(400)
          .json({ error: "Missing searchParam in the request body" });
      }

      // Use Mongoose to search for the product in the MongoDB collection
      const product = await Model.ProductModel.findOne({
        productName: { $regex: new RegExp(searchParam, "i") }, // Case-insensitive search
      });

      // Respond based on whether the product is found
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // checkout
  app.put("/api/search", async (req, res) => {
    // Extract id and quantity from query parameters
    const checkoutid = req.query.id;
    const checkoutquantity = req.query.quantity;

    // Check if id or quantity is missing
    if (!checkoutid || !checkoutquantity || checkoutquantity<=0) {
      return res.status(400).json({
        error: "Missing id or quantity in the request query parameters",
      });
    }

    try {
      // Find the product in MongoDB
      const product = await Model.ProductModel.findOne({
        productId: checkoutid,
      });

      // Respond based on whether the product is found
      if (product) {
        // Update the stock of the product
        product.stock -= parseInt(checkoutquantity, 10);
        await product.save();

        // Create a new order object
        const newOrder = new Model.orderModel({
          O_ID: uuidv4(),
          O_Address: "Sample Address", // Add the actual address details
          O_P_ID: checkoutid,
          O_status: "Pending", // Set the initial status
          O_totalcost: checkoutquantity * product.price,
          order_quantity: checkoutquantity,
        });

        // Save the new order to MongoDB
        await newOrder.save();

        // Respond with success and updated data
        res.json({
          success: "Stock and order updated successfully",
          updatedProduct: product,
          newOrder,
        });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // post_product(Add new product)
  app.post("/api", async (req, res) => {
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

    try {
      // Check if a product with the same productId already exists in MongoDB
      const existingProduct = await Model.ProductModel.findOne({
        productId: newProduct.productId,
      });

      // Respond based on whether the product with the same productId already exists
      if (existingProduct) {
        return res
          .status(400)
          .json({ error: "Product with the same productId already exists" });
      }

      // Create a new Product instance using the Mongoose model
      const productInstance = new Model.ProductModel(newProduct);

      // Save the new product to MongoDB
      await productInstance.save();

      // Respond with success and new product details
      res.json({ success: "Product added successfully", newProduct });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // put_product_id(For updating stock of a product by id)
  app.put("/api/id", async (req, res) => {
    // Extract id and quantity from query parameters
    const checkoutid = req.query.id;
    const checkoutquantity = req.query.quantity;
    const checkoutprice = req.query.price;

    try {
      // Find the product in MongoDB
      const product = await Model.ProductModel.findOne({
        productId: checkoutid,
      });

      // Respond based on whether the product is found
      if (product) {
        if(checkoutquantity && checkoutprice)
        {
          product.stock = parseInt(checkoutquantity, 10);
          product.price = parseInt(checkoutprice, 10);
          await product.save();
          res.json({
            success: "price and stock updated successfully",
            updatedProduct: product,
          });
        }
        // Update the stock of the product
        else if(checkoutquantity)
        {
          product.stock = parseInt(checkoutquantity, 10);
          await product.save();
          res.json({
            success: "Stock updated successfully",
            updatedProduct: product,
          });
        }
        else if(checkoutprice)
        { 
          product.price = parseInt(checkoutprice, 10);
          await product.save();
          res.json({
            success: "price updated successfully",
            updatedProduct: product,
          });
        }
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // delete_product(For deleting a product by id)
  app.delete("/api/id", async (req, res) => {
    // Extract id from query parameters
    const toDelete = parseInt(req.query.id, 10);

    // Check if id is invalid
    if (isNaN(toDelete)) {
      return res.status(400).json({ error: "Invalid id parameter" });
    }

    try {
      // Find the product in MongoDB
      const product = await Model.ProductModel.findOneAndDelete({
        productId: toDelete,
      });

      // Respond based on whether the product is found
      if (product) {
        // Respond with success
        res.json({ success: "Product deleted successfully" });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // order (For updating order details)
  app.post("/api/order", async (req, res) => {
    // Extract id and address from query parameters
    let checkoutid = req.query.id;
    let address = req.query.address;

    // Find the order in MongoDB
    try {
      const order = await Model.orderModel.findOne({
        O_P_ID: parseInt(checkoutid, 10),
      });

      // Respond based on whether the order is found
      if (order) {
        // Update order details
        order.O_Address = address;
        order.O_status = "pending";

        // Save the updated order to MongoDB
        await order.save();

        // Respond with success and updated order details
        res.json({
          success: "Order updated successfully",
          updatedOrder: order,
        });
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // get_product(Get product details through product id)
  app.get("/api/details", async (req, res) => {
    // Extract id from query parameters
    let id = req.query.id;

    try {
      // Find the product in MongoDB
      const product = await Model.ProductModel.findOne({ productId: id });

      // Respond based on whether the product is found
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // status (Get status of an order (e.g., whether it's pending))
  app.get("/api/status", async (req, res) => {
    // Extract orderid from query parameters
    let orderid = req.query.orderid;

    try {
      // Find the order in MongoDB
      const order = await Model.orderModel.findOne({ O_ID: orderid });

      // Respond based on whether the order is found
      if (order) {
        res.json(order.O_status);
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Cancel an order
  app.delete("/api/cancel", async (req, res) => {
    // Extract cancelid from query parameters
    const toDelete = req.query.cancelid;

    try {
      // Find the order in MongoDB
      const order = await Model.orderModel.findOne({ O_ID: toDelete });

      // Respond based on whether the order is found
      if (order) {
        // Retrieve the order quantity and the corresponding product ID
        const updatedQuant = order.order_quantity;
        const pid = order.O_P_ID;

        // Find the product in MongoDB
        const product = await Model.ProductModel.findOne({ productId: pid });

        // Respond based on whether the product is found
        if (product) {
          // Update the stock of the product with the given productId
          product.stock += parseInt(updatedQuant, 10);

          // Save the updated product to MongoDB
          await product.save();

          // Remove the order from the Order collection
          await Model.orderModel.deleteOne({ O_ID: toDelete });

          // Respond with success
          res.json({ success: "Order canceled successfully" });
        } else {
          res.status(404).json({ error: "Product not found" });
        }
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
}

function handleJsonRoutes(app) {
  app.use(bodyParser.json());
  const productsData = JSON.parse(fs.readFileSync("./jsondb/products.json", "utf8"));
  const orderData = JSON.parse(fs.readFileSync("./jsondb/order.json", "utf8"));

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
      fs.writeFileSync(
        "order.json",
        JSON.stringify(orderData, null, 2),
        "utf8"
      );

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
    const productIndex = productsData.findIndex(
      (p) => p.productId === toDelete
    );

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
      fs.writeFileSync(
        "order.json",
        JSON.stringify(orderData, null, 2),
        "utf8"
      );

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
}

module.exports = { handleMongoRoutes, handleJsonRoutes };
