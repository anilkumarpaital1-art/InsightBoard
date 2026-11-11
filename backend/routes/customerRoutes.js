const { protect, authorize } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");


// GET: Fetch customers with search, filters, sorting and pagination
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
      "name",
      "email",
      "company",
      "status",
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
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { company: { $regex: safeSearch, $options: "i" } }
      ];
    }

    if (["Active", "Inactive"].includes(status)) {
      filter.status = status;
    }

    const totalCustomers = await Customer.countDocuments(filter);

    let customersQuery = Customer.find(filter)
  .sort({ [sortField]: sortOrder });

if (all !== "true") {
  customersQuery = customersQuery
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit);
}

const customers = await customersQuery;

    res.status(200).json({
      success: true,
      totalCustomers,
      currentPage: pageNumber,
      totalPages:
  all === "true"
    ? 1
    : Math.ceil(totalCustomers / pageLimit),
      customers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// POST: Create customer
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, email, phone, company, status } = req.body;

    const customer = await Customer.create({
      name,
      email,
      phone,
      company,
      status
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer
    });

  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: error.code === 11000
        ? "This email already exists"
        : error.message
    });
  }
});


// PATCH: Update customer
router.patch("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


// DELETE: Bulk delete customers
router.delete("/bulk", protect, authorize("admin"), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide customer IDs"
      });
    }

    if (ids.some(id => !/^[0-9a-fA-F]{24}$/.test(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const result = await Customer.deleteMany({
      _id: { $in: [...new Set(ids)] }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} customers deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE: Delete single customer
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      message: "Customer deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
