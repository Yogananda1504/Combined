/**
 * @module controllers/authController
 */

import appError from "../../utils/student/appError.js";
import { generateToken } from "../../utils/student/tokenUtils.js";
import dotenv from "dotenv";
import DataService from "../../utils/student/dataService.js";
import Ldap_authenticator from "../../utils/student/Ldap_authenticator.js";

dotenv.config();

// Test credentials for development environment
const TEST_CREDENTIALS = {
	2211201152: {
		username: "2211201152",
		password: "password123",
		details: {
			name: "Test User",
			email: "vynr1504@gmail.com",
			uid: "2211201152",
			department: "Computer Science",
			year: "3",
			hostel: "H5",
		},
	},
	2211201109: {
		username: "2211201109",
		password: "password123",
		details: {
			name: "Kummari Siddharth",
			email: "siddharth7258@gmail.com",
			uid: "2211201109",
			department: "Computer Science",
			year: "3",
			hostel: "H6",
		},
	},
};

// Create authenticator with fallback mechanism for LDAP connection failures
let authenticator;
try {
	authenticator = new Ldap_authenticator(
		process.env.LDAP_BASE_STUDENT_DN || "dc=dev,dc=com",
		{
			// TLS configuration based on environment variable
			secure: process.env.LDAP_USE_TLS === "true",
			tlsOptions:
				process.env.LDAP_USE_TLS === "true"
					? {
							rejectUnauthorized: false, // Adjust based on your TLS requirements
					  }
					: undefined,
		}
	);
	console.log("LDAP authenticator initialized successfully");
} catch (err) {
	console.error("Failed to initialize LDAP authenticator:", err);
	// We'll continue without the authenticator and fall back to test credentials when needed
}

const dataServiceInstance = new DataService();

/**
 * Controller for handling user authentication.
 *
 * @file ./controllers/authController.js
 *
 * @async
 * @function authController
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.username - The username of the user.
 * @param {string} req.body.password - The password of the user.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 *
 * @throws {appError} If username or password is missing.
 * @throws {appError} If authentication fails.
 * @throws {appError} If there is an error during authentication.
 *
 * @returns {Promise<void>} Sends a JSON response with user details if authentication is successful.
 */
const authController = async (req, res, next) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return next(new appError("Username and password are required", 401));
		}

		// First try to authenticate with test credentials
		const testUser = TEST_CREDENTIALS[username];
		if (testUser && testUser.password === password) {
			const user = {
				...testUser.details,
				role: "student", // Explicitly assign student role to test users
			};
			const token = generateToken({
				username,
				email: user.email,
				role: "student",
			});

			res.cookie("jwt", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			});

			console.log(
				`User ${username} authenticated using test credentials (role: student)`
			);
			return res.status(200).json({
				success: true,
				message: "User authenticated successfully",
				user,
			});
		}

		// If no test user matched and LDAP is unavailable, authentication fails
		if (!authenticator) {
			console.warn(
				`Authentication failed for ${username}: LDAP unavailable and no matching test user`
			);
			return next(new appError("Authentication service unavailable", 503));
		}

		// Attempt LDAP authentication with error handling
		try {
			const status = await authenticator.authenticate(username, password);

			if (!status) {
				console.warn(`Invalid credentials for user ${username}`);
				return next(new appError("Invalid scholar number or password", 401));
			}

			// Fetch user details and send response in parallel
			const userPromise = dataServiceInstance.getGenericDetails(username);
			const [user] = await Promise.all([userPromise]);

			// Create the JWT token for the user
			const token = generateToken({ username, email: user.email });

			// Set the token as a secure, HTTP-only cookie
			res.cookie("jwt", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			});

			console.log(`User ${username} authenticated successfully via LDAP`);
			return res.status(200).json({
				success: true,
				message: "User authenticated successfully",
				user,
			});
		} catch (ldapError) {
			console.error(`LDAP authentication error:`, ldapError);

			// If LDAP fails but we have test credentials available in non-production
			if (
				process.env.NODE_ENV !== "production" &&
				TEST_CREDENTIALS[username] &&
				TEST_CREDENTIALS[username].password === password
			) {
				// Fall back to test credentials
				const user = TEST_CREDENTIALS[username].details;
				const token = generateToken({ username, email: user.email });

				res.cookie("jwt", token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
				});

				console.log(
					`User ${username} authenticated using test credentials (LDAP fallback)`
				);
				return res.status(200).json({
					success: true,
					message: "User authenticated successfully",
					user,
				});
			}

			return next(new appError("Authentication service unavailable", 503));
		}
	} catch (err) {
		console.error("Error in authentication controller:", err);
		return next(new appError("Error in authenticating user", 500));
	}
};

export default authController;
