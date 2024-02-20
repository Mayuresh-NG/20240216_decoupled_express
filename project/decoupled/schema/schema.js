const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productId: Number,
  productName: String,
  description: String,
  price: Number,
  stock: Number,
  imageUrl: String,
});

const ProductModel = mongoose.model("Product", productSchema, "products");

const orderSchema = new mongoose.Schema({
  O_ID: String,
  O_Address: String,
  O_P_ID: Number,
  O_status: String,
  O_totalcost: Number,
  order_quantity: Number,
});

const orderModel = mongoose.model("Order", orderSchema, "order");

module.exports= {ProductModel, orderModel};
