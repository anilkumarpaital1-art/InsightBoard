const { protect, authorize } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET: Fetch products with search, filter and pagination
router.get("/", protect, async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      page = 1,
      limit = 8,
      sortBy = "createdAt",
      order = "desc",
      all = "false",
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 8));

    const allowedSortFields = [
      "name",
      "category",
      "price",
      "stock",
      "status",
      "createdAt",
    ];

    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;

    const filter = {};

    if (search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { category: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const totalProducts = await Product.countDocuments(filter);

let productsQuery = Product.find(filter)
  .sort({ [sortField]: sortOrder });

if (all !== "true") {
  productsQuery = productsQuery
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize);
}

const products = await productsQuery;

    res.json({
      success: true,
      totalProducts,
      currentPage,
      totalPages:
  all === "true"
    ? 1
    : Math.ceil(totalProducts / pageSize),
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST: Create product
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// PATCH: Update product
router.patch("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "category",
      "description",
      "price",
      "stock",
      "status",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});



// DELETE: Bulk delete products
 router.delete("/bulk", protect, authorize("admin"), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide product IDs"
      });
    }

    if (ids.some(id => !/^[0-9a-fA-F]{24}$/.test(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const result = await Product.deleteMany({
      _id: { $in: [...new Set(ids)] }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} products deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE: Delete single product
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
