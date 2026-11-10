
const express = require("express");
const router = express.Router();

const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Order = require("../models/Order");

const { protect } = require("../middleware/authMiddleware");

const getDateRange = (range) => {
  const now = new Date();
  const endDate = new Date(now);

  let startDate = new Date(now);
  let daily = false;

  if (range === "7d") {
    startDate.setUTCDate(startDate.getUTCDate() - 6);
    daily = true;
  } else if (range === "30d") {
    startDate.setUTCDate(startDate.getUTCDate() - 29);
    daily = true;
  } else {
    const months = {
      "3m": 3,
      "6m": 6,
      "12m": 12,
    }[range] || 12;

    startDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - months + 1,
      1
    ));
  }

  startDate.setUTCHours(0, 0, 0, 0);

  return { startDate, endDate, daily };
};

router.get("/", protect, async (req, res) => {
  try {
const allowedRanges = ["7d", "30d", "3m", "6m", "12m"];

let range;
let startDate;
let endDate;
let daily;

const { startDate: customStart, endDate: customEnd } = req.query;

if (customStart || customEnd) {
  // Both dates are required for a custom range.
  if (!customStart || !customEnd) {
    return res.status(400).json({
      success: false,
      message: "Both start date and end date are required.",
    });
  }

  // Validate YYYY-MM-DD format.
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(customStart) || !datePattern.test(customEnd)) {
    return res.status(400).json({
      success: false,
      message: "Invalid date format. Use YYYY-MM-DD.",
    });
  }

  startDate = new Date(`${customStart}T00:00:00.000Z`);
  endDate = new Date(`${customEnd}T23:59:59.999Z`);

  // Validate actual calendar dates.
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate.toISOString().slice(0, 10) !== customStart ||
    endDate.toISOString().slice(0, 10) !== customEnd
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid calendar dates.",
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      success: false,
      message: "Start date cannot be after end date.",
    });
  }

  // Prevent excessively large custom ranges.
  const daysDifference =
    (endDate - startDate) / (1000 * 60 * 60 * 24);

  if (daysDifference > 1825) {
    return res.status(400).json({
      success: false,
      message: "Custom date range cannot exceed 5 years.",
    });
  }

  range = "custom";
  daily = daysDifference < 31;
} else {
  range = allowedRanges.includes(req.query.range)
    ? req.query.range
    : "12m";

  const dateRange = getDateRange(range);

  startDate = dateRange.startDate;
  endDate = dateRange.endDate;
  daily = dateRange.daily;
}

    const dateFilter = {
      $gte: startDate,
      $lte: endDate,
    };

    const groupFormat = daily ? "%Y-%m-%d" : "%Y-%m";

    const [
      totalCustomers,
      totalProducts,
      totalOrders,
      completedOrders,
      revenueResult,
      orderStatus,
      monthlyRevenue,
      monthlyOrders,
    ] = await Promise.all([
      Customer.countDocuments({ createdAt: dateFilter }),
      Product.countDocuments({ createdAt: dateFilter }),
      Order.countDocuments({ orderDate: dateFilter }),
      Order.countDocuments({
        status: "Completed",
        orderDate: dateFilter,
      }),

      Order.aggregate([
        {
          $match: {
            status: "Completed",
            orderDate: dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]),

      Order.aggregate([
        { $match: { orderDate: dateFilter } },
        {
          $group: {
            _id: "$status",
            value: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            status: "Completed",
            orderDate: dateFilter,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupFormat,
                date: "$orderDate",
                timezone: "UTC",
              },
            },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        { $match: { orderDate: dateFilter } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupFormat,
                date: "$orderDate",
                timezone: "UTC",
              },
            },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Generate labels for every day or month in the selected period.
const buckets = [];

const cursor = daily
  ? new Date(startDate)
  : new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      1
    ));

    if (daily) {
      while (cursor <= endDate) {
        const key = cursor.toISOString().slice(0, 10);

        buckets.push({
          key,
          label: cursor.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            timeZone: "UTC",
          }),
        });

        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    } else {
      while (cursor <= endDate) {
        const key = cursor.toISOString().slice(0, 7);

        buckets.push({
          key,
          label: cursor.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
        });

        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    }

    const revenueMap = new Map(
      monthlyRevenue.map((item) => [item._id, item.revenue])
    );

    const ordersMap = new Map(
      monthlyOrders.map((item) => [item._id, item.orders])
    );

    const revenueData = buckets.map((item) => ({
      month: item.label,
      revenue: revenueMap.get(item.key) || 0,
    }));

    const ordersData = buckets.map((item) => ({
      month: item.label,
      orders: ordersMap.get(item.key) || 0,
    }));

    const orderStatusData = orderStatus.map((item) => ({
      name: item._id,
      value: item.value,
    }));

res.status(200).json({
  success: true,
  range,
  customStartDate: range === "custom" ? customStart : null,
  customEndDate: range === "custom" ? customEnd : null,
      stats: {
        totalRevenue: revenueResult[0]?.total || 0,
        totalOrders,
        totalCustomers,
        totalProducts,
        completedOrders,
      },
      revenueData,
      ordersData,
      orderStatusData,
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard analytics.",
    });
  }
});

module.exports = router;
