/**
 * @file app.js
 * @module CompliantPortalBackend
 * @description Main application file for the Compliant Portal Backend, setting up middleware, routes, and error handling.
 */
// Core modules
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

// Third-party modules
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import csrf from "@dr.pogodin/csurf";
import rateLimit from "express-rate-limit";

// Custom modules
import { protect } from "./middleware/student/protect.js";
import csrfProtection from "./middleware/student/csrfMiddleware.js";
import complainRoutes from "./routes/student/complainRoutes.js";
import profileRoutes from "./routes/student/profileRoutes.js";
import loginRoutes from "./routes/student/loginRoutes.js";
import logoutRoutes from "./routes/student/logoutRoutes.js";
import feedbackRoutes from "./routes/student/feedbackRoutes.js";
import validateRoutes from "./routes/student/validateRoutes.js";
import AppError from "./utils/student/appError.js"; // Renamed to PascalCase

// Admin imports
import { router as AdminLoginRoutes } from "./routes/admin/loginRoutes.js";
import { logoutRoutes as AdminLogoutRoutes } from "./routes/admin/logoutRoutes.js";
import { router as AdminComplainRoutes } from "./routes/admin/complainRoutes.js";
import { utilityRoutes as AdminUtilityRoutes } from "./routes/admin/utilityRoutes.js";
import { validateRoutes as AdminValidateRoutes } from "./routes/admin/validateRoutes.js";
import dashboardRoutes from "./routes/admin/dashboardRoutes.js";
import {
	getDashboardData,
	Resolution,
} from "./controllers/admin/DashboardController.js";
import { verifyToken } from "./utils/admin/tokenUtils.js";
import { calculateStats as hostelStats } from "./controllerFunctions/admin/hostelFunctions.js";
import { calculateStats as academicStats } from "./controllerFunctions/admin/academicFunctions.js";
import { calculateStats as medicalStats } from "./controllerFunctions/admin/medicalFunctions.js";
import { calculateStats as infrastructureStats } from "./controllerFunctions/admin/infrastructureFunctions.js";
import { calculateStats as raggingStats } from "./controllerFunctions/admin/raggingFunctions.js";
import {
	updateCowDashboardData,
	updateWardenDashboardData,
} from "./controllers/admin/HostelDashboardController.js";

dotenv.config();

/**
 * CORS Configuration
 */
const corsConfig = cors({
	origin: process.env.ALLOWED_ORIGINS
		? process.env.ALLOWED_ORIGINS.split(",")
		: "http://localhost:5173",
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization", "csrf-token"],
});

const app = express();

// Apply security and parsing middlewares early
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'"], // Consider removing 'unsafe-inline' in production
				styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
				imgSrc: ["'self'", "data:"],
				connectSrc: ["'self'"],
				fontSrc: ["'self'", "fonts.gstatic.com"],
				objectSrc: ["'none'"],
				mediaSrc: ["'self'"],
				frameSrc: ["'none'"],
				formAction: ["'self'"],
				upgradeInsecureRequests:
					process.env.NODE_ENV === "production" ? [] : null,
			},
		},
		xssFilter: true,
		noSniff: true,
		referrerPolicy: { policy: "same-origin" },
	})
);
app.use(morgan("dev"));
app.use(corsConfig);
app.use(express.json({ limit: "10kb" })); // Limit body size to prevent large payload attacks
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply rate limiting to all requests
const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true,
	message: "Too many requests from this IP, please try again later",
});
app.use(globalLimiter);

// Apply stricter rate limiting to authentication routes
const authLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 5, // Limit each IP to 5 login attempts per hour
	standardHeaders: true,
	message:
		"Too many login attempts from this IP, please try again after an hour",
});
app.use("/student/login", authLimiter);
app.use("/admin/login", authLimiter);

/**
 * Serve static files from the "uploads" directory
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the dist directory for the frontend
app.use(express.static(path.join(__dirname, "dist")));

/**
 * Health Check Route
 */
app.get("/ping", (req, res) => {
	res.send("pong");
});

// Root Route
app.get("/", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "Welcome to the Complaint Portal API",
	});
});

// Routes
app.use("/api/student/complain", complainRoutes);
app.use("/api/student/profile", profileRoutes);
app.use("/api/student/login", loginRoutes);
app.use("/api/student/logout", logoutRoutes);

// Secure uploads directory - require authentication and prevent path traversal
app.use("/api/student/uploads/:filename", protect, (req, res, next) => {
	// Get filename parameter and sanitize it to prevent directory traversal attacks
	const filename = path
		.normalize(req.params.filename)
		.replace(/^(\.\.[\/\\])+/, "");
	const filePath = path.join(__dirname, "uploads", filename);

	// Verify the file path is within the uploads directory
	if (!filePath.startsWith(path.join(__dirname, "uploads"))) {
		return res.status(403).send("Access denied");
	}

	// Check if file exists before sending
	fs.access(filePath, fs.constants.F_OK, (err) => {
		if (err) {
			return res.status(404).send("File not found");
		}
		res.sendFile(filePath, (err) => {
			if (err) {
				console.error(`Error serving file ${filePath}:`, err);
				return res.status(500).send("Error serving file");
			}
		});
	});
});

app.use("/api/admin/uploads/:filename", protect, (req, res, next) => {
	// Get filename parameter and sanitize it to prevent directory traversal attacks
	const filename = path
		.normalize(req.params.filename)
		.replace(/^(\.\.[\/\\])+/, "");
	const filePath = path.join(__dirname, "uploads", filename);

	// Verify the file path is within the uploads directory
	if (!filePath.startsWith(path.join(__dirname, "uploads"))) {
		return res.status(403).send("Access denied");
	}

	// Check if file exists before sending
	fs.access(filePath, fs.constants.F_OK, (err) => {
		if (err) {
			return res.status(404).send("File not found");
		}
		res.sendFile(filePath, (err) => {
			if (err) {
				console.error(`Error serving file ${filePath}:`, err);
				return res.status(500).send("Error serving file");
			}
		});
	});
});

app.get("/api/student/csrf-token", protect, csrfProtection, (req, res) => {
	res.json({ csrfToken: req.csrfToken() });
});
app.use("/api/student/validate", validateRoutes);
app.use("/api/student/feedback", feedbackRoutes);

// === Begin Admin Socket.io and Routes Integration ===

// Create HTTP server and Socket.io instance
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: process.env.ALLOWED_ORIGINS
			? process.env.ALLOWED_ORIGINS.split(",")
			: ["http://localhost:5173", "http://localhost:5005"],
		credentials: true,
	},
	pingTimeout: 120000,
	pingInterval: 25000,
	transports: ["websocket", "polling"],
});

// Create admin namespace
const adminNamespace = io.of("/socket/admin");

// Admin Socket.io middleware
adminNamespace.use((socket, next) => {
	try {
		const token = socket.handshake.headers?.cookie
			?.split("jwt=")?.[1]
			?.split(";")?.[0];
		const role_token = socket.handshake.headers?.cookie
			?.split("role=")?.[1]
			?.split(";")?.[0];

		const decodedUser = verifyToken(token);
		const decodedRole = verifyToken(role_token);

		if (!decodedUser) return next(new Error("Invalid or expired token"));
		if (!decodedRole) return next(new Error("Invalid or expired token"));

		socket.user = decodedUser.username;
		socket.role = decodedRole.role;

		next();
	} catch {
		next(new Error("Authentication failed"));
	}
});

// Admin Socket.io Connection handler
adminNamespace.on("connection", async (socket) => {
	console.log("New client connected to admin namespace:", socket.id);
	let lastHeartbeat = Date.now();
	const heartbeatInterval = setInterval(() => {
		socket.emit("ping");
	}, 25000);
	socket.on("pong", () => {
		lastHeartbeat = Date.now();
		console.log(`Heartbeat received from ${socket.id}`);
	});
	const connectionMonitor = setInterval(() => {
		if (Date.now() - lastHeartbeat > 60000) {
			console.log(`Client ${socket.id} connection dead - no heartbeat`);
			socket.disconnect(true);
		}
	}, 30000);
	try {
		const [initialData, resolutionData] = await Promise.all([
			getDashboardData(),
			Resolution(),
		]);
		socket.emit("setResolution", resolutionData);
		socket.emit("analyticsUpdate", initialData);
		const updateInterval = setInterval(async () => {
			try {
				const [data, newResolutionData] = await Promise.all([
					getDashboardData(),
					Resolution(),
				]);
				if (socket.connected) {
					socket.emit("analyticsUpdate", data);
					socket.emit("setResolution", newResolutionData);
				}
			} catch (error) {
				console.error("Error fetching real-time data:", error);
			}
		}, 1000);
		socket.on("hostelStats", async () => {
			console.log("Received hostelStats request\n");
			const stats = await hostelStats();
			socket.emit("sethostelStats", stats);
		});
		socket.on("academicStats", async () => {
			const stats = await academicStats();
			socket.emit("setacademicStats", stats);
		});
		socket.on("medicalStats", async () => {
			const stats = await medicalStats();
			socket.emit("setmedicalStats", stats);
		});
		socket.on("infrastructureStats", async () => {
			const stats = await infrastructureStats();
			socket.emit("setinfrastructureStats", stats);
		});
		socket.on("raggingStats", async () => {
			const stats = await raggingStats();
			socket.emit("setraggingStats", stats);
		});
		socket.on("cowDashboardData", async () => {
			console.log("The cow has requested for the hostels data \n");
			const data = await updateCowDashboardData();
			socket.emit("setCowDashboardData", data);
		});
		socket.on("getWardenDashboardData", async () => {
			console.log("The warden has requested for the hostels data \n");
			const data = await updateWardenDashboardData(socket.role);
			socket.emit("setWardenDashboardData", data);
		});
		socket.on("disconnect", (reason) => {
			clearInterval(heartbeatInterval);
			clearInterval(connectionMonitor);
			console.log(`Client disconnected (${reason}):`, socket.id);
		});
	} catch (error) {
		console.error("Error in socket connection:", error);
		socket.disconnect();
	}
});

// Admin routes registration
app.use("/api/admin/login", AdminLoginRoutes);
app.use("/api/admin/logout", AdminLogoutRoutes);
app.use("/api/admin/complaints", AdminComplainRoutes);
app.use("/api/admin/utility", AdminUtilityRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/validate", AdminValidateRoutes);
// === End Admin Socket.io and Routes Integration ===

/**
 * 404 Handler for undefined routes
 */
app.all("*", (req, res, next) => {
	next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

/**
 * Error Handling Middleware
 */
app.use((err, req, res, next) => {
	if (err.code === "EBADCSRFTOKEN") {
		return next(new AppError("Invalid CSRF token", 403));
	}

	// Handle MongoDB timeouts
	if (
		err.name === "MongooseError" &&
		err.message.includes("buffering timed out")
	) {
		console.error("MongoDB Operation Timeout:", err);
		return res.status(503).json({
			status: "error",
			statusCode: 503,
			message: "Database operation timed out. Please try again later.",
		});
	}

	// Set default status code and message
	const statusCode = err.statusCode || 500;
	const message = err.message || "Internal Server Error";

	// Log the error
	console.error(err);

	// Send error response
	res.status(statusCode).json({
		status: "error",
		statusCode,
		message,
	});
	return; // Ensure the response is sent only once
});

// This catch-all route must be AFTER the API routes and BEFORE the 404 handling
// It will serve the index.html file for all client-side routes


// Handle 404 for any remaining routes (like missing API endpoints)
app.get("*", (req, res) => {
	// Skip for file requests with extensions
	if (req.path.includes(".")) {
		return res.status(404).send({ message: "File Not Found" });
	}

	// Send 404 for any non-matched API routes
	if (req.path.startsWith("/api")) {
		return res.status(404).send({ message: "API Route Not Found" });
	}

	// For any other routes that might be client-side routes we didn't anticipate
	res.sendFile(path.join(__dirname, "dist", "index.html"));
});

export { app, server };
