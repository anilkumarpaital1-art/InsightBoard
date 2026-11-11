const { protect, authorize } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// GET: Fetch orders with search, status filter, sorting and pagination
router.get("/", protect, async (req, res) => {
  try {
    const {
  search = "",
  status = "",
  page = 1,
  limit = 5,
  sortBy = "createdAt",
  order = "desc",
  all = "false"
} = req.query;

    const pageNumber = Math.max(1, parseInt(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit) || 5));

    const allowedSortFields = [
      "customerName",
      "customerEmail",
      "product",
      "quantity",
      "totalAmount",
      "status",
      "orderDate",
      "createdAt"
    ];

    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;

    const filter = {};

    if (search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { customerName: { $regex: safeSearch, $options: "i" } },
        { customerEmail: { $regex: safeSearch, $options: "i" } },
        { product: { $regex: safeSearch, $options: "i" } }
      ];
    }

    if (["Pending", "Processing", "Completed", "Cancelled"].includes(status)) {
      filter.status = status;
    }

    const totalOrders = await Order.countDocuments(filter);

let ordersQuery = Order.find(filter)
  .sort({ [sortField]: sortOrder });

if (all !== "true") {
  ordersQuery = ordersQuery
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit);
}

const orders = await ordersQuery;

    res.status(200).json({
      success: true,
      totalOrders,
      currentPage: pageNumber,
      totalPages:
  all === "true"
    ? 1
    : Math.ceil(totalOrders / pageLimit),
      orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// POST: Create order
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      product,
      quantity,
      totalAmount,
      status
    } = req.body;

    const order = await Order.create({
      customerName,
      customerEmail,
      product,
      quantity,
      totalAmount,
      status
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


// PATCH: Update order
router.patch("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const allowedFields = [
      "customerName",
      "customerEmail",
      "product",
      "quantity",
      "totalAmount",
      "status"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


// DELETE: Bulk delete orders
 router.delete("/bulk", protect, authorize("admin"), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide order IDs"
      });
    }

    if (ids.some(id => !/^[0-9a-fA-F]{24}$/.test(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const result = await Order.deleteMany({
      _id: { $in: [...new Set(ids)] }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} orders deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE: Delete single order
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
module.exports = router;
