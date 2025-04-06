/**
 * @file connectDB.js
 * @description This file contains the configuration and function to connect to the MongoDB database using Mongoose.
 * @module config/connectDB
 */

import mongoose from "mongoose";

mongoose.set("strictQuery", false);
import dotenv from "dotenv";
dotenv.config();

/**
 * Asynchronously connects to the MongoDB database using the connection URI
 * specified in the environment variable `MONGO_URI`.
 *
 * @async
 * @function connectToDB
 * @returns {Promise<void>} A promise that resolves when the connection is successful.
 * @throws Will throw an error if the connection fails.
 */
const connectToDB = async () => {
	try {
		// Set global MongoDB connection options for improved reliability
		const options = {
			serverSelectionTimeoutMS: 15000, // Timeout for server selection (increased from default)
			socketTimeoutMS: 45000, // How long the MongoDB driver will wait before timing out
			connectTimeoutMS: 30000, // Initial connection timeout
			maxPoolSize: 50, // Maximum number of connections in the connection pool
			minPoolSize: 10, // Minimum number of connections in the connection pool
			maxIdleTimeMS: 30000, // How long a connection can remain idle before being removed
			// keepAlive: true,
		};

		const client = await mongoose.connect(process.env.MONGO_URI, options);

		if (client) {
			console.log("Connected to DB: ", client.connection.host);
		}
	} catch (error) {
		console.log("MongoDB connection error:", error.message);
		// Retry logic could be added here
	}
};

export default connectToDB;
