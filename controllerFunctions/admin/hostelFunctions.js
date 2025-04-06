import HostelComplaint from "../../models/HostelComplaints.js";
import { Hostel_logger as logger } from "../../utils/admin/logger.js";
import { checkActivityandProcess } from "../../utils/admin/email_automator.js";
// Moved stats calculation to a more efficient single aggregation
export const calculateStats = async () => {
	try {
		// Set a timeout for the aggregation operation
		const [result] = await HostelComplaint.aggregate([
			{
				$group: {
					_id: null,
					totalComplaints: { $sum: 1 },
					resolvedComplaints: {
						$sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
					},
					unresolvedComplaints: {
						$sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
					},
					viewedComplaints: {
						$sum: { $cond: [{ $eq: ["$readStatus", "Viewed"] }, 1, 0] },
					},
					notViewedComplaints: {
						$sum: { $cond: [{ $eq: ["$readStatus", "Not viewed"] }, 1, 0] },
					},
				},
			},
		]).option({ maxTimeMS: 5000 }); // Add a 5-second timeout for the aggregation

		return (
			result || {
				totalComplaints: 0,
				resolvedComplaints: 0,
				unresolvedComplaints: 0,
				viewedComplaints: 0,
				notViewedComplaints: 0,
			}
		);
	} catch (error) {
		console.error("Error in calculateStats:", error);
		// Return default values if the operation times out
		return {
			totalComplaints: 0,
			resolvedComplaints: 0,
			unresolvedComplaints: 0,
			viewedComplaints: 0,
			notViewedComplaints: 0,
		};
	}
};

// Helper function for date validation
const validateDates = (startDate, endDate) => {
	const parseDate = (dateStr, defaultDate) => {
		const date = dateStr ? new Date(dateStr) : defaultDate;
		if (isNaN(date.getTime())) throw new Error("Invalid date format");
		return date;
	};

	return {
		start: parseDate(startDate, new Date(0)),
		end: parseDate(endDate, new Date()),
	};
};

export const hostelDataController = async (req, res) => {
	try {
		// extract role from req
		// denote the access to respective admins . Implement getHostelNumber according Number

		// Disable caching for this response
		res.setHeader(
			"Cache-Control",
			"no-store, no-cache, must-revalidate, proxy-revalidate"
		);
		res.setHeader("Pragma", "no-cache");
		res.setHeader("Expires", "0");
		res.setHeader("Surrogate-Control", "no-store");

		const filters = JSON.parse(req.query.filters || "{}");
		filters.scholarNumbers = filters.scholarNumbers.filter((num) =>
			/^\d{10}$/.test(num)
		);
		console.log("Initiated the hostelDataController\n");

		const { start: startDate, end: endDate } = validateDates(
			filters.startDate,
			filters.endDate
		);
		if (startDate > endDate)
			return res
				.status(400)
				.json({ error: "startDate must be before endDate" });

		// Log query parameters for debugging
		console.log("Hostel Data Query Filters:", filters);

		const query = {
			createdAt: { $gte: startDate, $lte: endDate }, // Use validated endDate
			...(filters.complaintType && { complainType: filters.complaintType }),
			...(filters.scholarNumbers.length && {
				scholarNumber: { $in: filters.scholarNumbers },
			}),
			...(filters.readStatus && { readStatus: filters.readStatus }),
			...(filters.status && { status: filters.status }),
			...(filters.hostelNumber && { hostelNumber: filters.hostelNumber }),
		};

		console.log("\nThe query is : ", query, "\n");

		const limit = parseInt(req.query.limit) || 20;

		if (req.query.lastSeenId) {
			const lastComplaint = await HostelComplaint.findById(req.query.lastSeenId)
				.lean()
				.maxTimeMS(5000); // Add timeout to findById

			if (!lastComplaint)
				return res.status(400).json({ error: "Invalid lastSeenId" });

			query.$or = [
				{ createdAt: { $gt: lastComplaint.createdAt } },
				{
					createdAt: lastComplaint.createdAt,
					_id: { $gt: req.query.lastSeenId },
				},
			];
		}

		// Add maxTimeMS to avoid timeout
		// Changed sort order to ensure newer complaints appear first
		const complaints = await HostelComplaint.find(query)
			.sort({ createdAt: -1, _id: -1 }) // Sort by newest first
			.limit(limit)
			.select(
				"scholarNumber studentName complainType createdAt status readStatus complainDescription room hostelNumber attachments AdminRemarks AdminAttachments resolvedAt useremail"
			)
			.lean()
			.maxTimeMS(8000); // Set a maximum execution time for the query

		console.log("Complaints count:", complaints.length);

		// Debug: Print retrieved complaint IDs to help troubleshoot
		console.log(
			"Retrieved complaint IDs:",
			complaints.map((c) => c._id)
		);

		const nextLastSeenId =
			complaints.length === limit
				? complaints[complaints.length - 1]._id
				: null;

		return res.json({
			complaints: complaints.map((complaint) => ({
				...complaint,
				attachments: Array.isArray(complaint.attachments)
					? complaint.attachments.map((filePath) => {
							// Handle both relative and absolute paths
							const normalizedPath =
								filePath.includes(":\\") || filePath.includes(":/")
									? filePath.split(/[\/\\]/).pop() // Extract filename from absolute path
									: filePath;

							return {
								url: `${req.protocol}://${req.get("host")}/${normalizedPath}`,
							};
					  })
					: [],
				AdminAttachments: Array.isArray(complaint.AdminAttachments)
					? complaint.AdminAttachments.map((filePath) => {
							// Handle both relative and absolute paths
							const normalizedPath =
								filePath.includes(":\\") || filePath.includes(":/")
									? filePath.split(/[\/\\]/).pop() // Extract filename from absolute path
									: filePath;

							return {
								url: `${req.protocol}://${req.get("host")}/${normalizedPath}`,
							};
					  })
					: [],
				category: "Hostel",
			})),
			nextLastSeenId,
		});
	} catch (error) {
		console.log("Error in hostelDataController:", error);
		// Check for timeout errors
		if (error.name === "MongooseError" && error.message.includes("timed out")) {
			return res.status(503).json({
				error:
					"Database operation timed out. Please try again with more specific filters.",
			});
		}
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const hostelComplaintStatusController = async (req, res) => {
	try {
		const { id, status } = req.body;
		if (!["resolved", "viewed"].includes(status)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		const update =
			status === "resolved"
				? { status: "Resolved", resolvedAt: new Date() }
				: { readStatus: "Viewed" };

		const complaint = await HostelComplaint.findByIdAndUpdate(id, update, {
			new: true,
		});
		if (!complaint)
			return res.status(404).json({ error: "Complaint not found" });

		if (status === "resolved") {
			try {
				await checkActivityandProcess({
					category: "hostel",
					complaintId: id,
					activity: "resolved",
					complaint,
				});
			} catch (mailError) {
				logger.error(`Mail forwarding error: ${mailError.message}`);
			}
		} else {
			try {
				await checkActivityandProcess({
					category: "hostel",
					complaintId: id,
					activity: "viewed",
					complaint,
				});
			} catch (mailError) {
				logger.error(`Mail forwarding error: ${mailError.message}`);
			}
		}

		logger.info(
			`Admin ${status} Hostel complaint ${id} at ${
				new Date().toISOString().split("T")[0]
			}`
		);
		res.json({ success: true, complaint });
	} catch (error) {
		res
			.status(500)
			.json({ success: false, message: "Error updating complaint status" });
	}
};

export const hostelStatsController = async (req, res) => {
	try {
		const stats = await calculateStats();
		res.status(200).json({ success: true, ...stats });
	} catch (err) {
		res
			.status(500)
			.json({ success: false, message: "Error in fetching stats" });
	}
};

export const hostelRemarkController = async (req, res) => {
	try {
		const AdminAttachments = req.filePaths || [];
		console.log(req.body);
		const AdminRemarks = req.body.AdminRemarks;
		const id = req.body.id;

		if (!id) {
			return res.status(400).json({ error: "Complaint ID is required" });
		}

		const update = {
			AdminRemarks: AdminRemarks,
			AdminAttachments: AdminAttachments,
		};

		const complaint = await HostelComplaint.findByIdAndUpdate(id, update, {
			new: true,
		});

		console.log(complaint);

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		logger.info(
			`Admin updated remarks for Hostel complaint ${id} at ${new Date().toISOString()}`
		);
		res.json({ success: true, complaint });
	} catch (error) {
		logger.error(
			`Error updating remarks for Hostel complaint: ${error.message}`
		);
		res
			.status(500)
			.json({ success: false, message: "Error updating complaint remarks" });
	}
};
