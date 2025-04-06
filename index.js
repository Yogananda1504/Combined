import { server } from "./app.js";
import connectToDB from "./config/connectDB.js";

// Process handlers for graceful shutdown
process.on("uncaughtException", (err) => {
	console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
	console.error(err.name, err.message, err.stack);
	process.exit(1);
});

// Connect to database before starting server
async function startServer() {
	try {
		await connectToDB();
		console.log("MongoDB connection established successfully");

		const PORT = process.env.PORT || 5000;
		server.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (err) {
		console.error("Failed to start server:", err);
		process.exit(1);
	}
}

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.error("UNHANDLED REJECTION! 💥 Shutting down...");
	console.error(err);
	server.close(() => {
		process.exit(1);
	});
});
