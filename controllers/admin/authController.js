// Description: This file contains the logic to authenticate a user using LDAP and generate a JWT token for the user.
import { generateToken } from "../../utils/admin/tokenUtils.js";
import dotenv from "dotenv";
import Ldap_authenticator from "../../utils/admin/Ldap_authenticator.js";

dotenv.config();

const authenticator = new Ldap_authenticator(
	process.env.LDAP_BASE_DN || "dc=dev,dc=com"
);

// In a production environment, demo users should be removed
// For development only - replace with environment variables
const demoUsers =
	process.env.NODE_ENV === "production"
		? []
		: [
				{
					username:  "test",
					password: "test@143",
					role: process.env.TEST_ROLE || "admin",
				},
				{
					username: process.env.ADMIN_USERNAME,
					password: process.env.ADMIN_PASSWORD,
					role: process.env.ADMIN_ROLE,
				},
				{
					username: process.env.ELECTRICADMIN_USERNAME,
					password: process.env.ELECTRICADMIN_PASSWORD,
					role: process.env.ELECTRICADMIN_ROLE,
				},
				{
					username: process.env.INTERNETADMIN_USERNAME,
					password: process.env.INTERNETADMIN_PASSWORD,
					role: process.env.INTERNETADMIN_ROLE,
				},
				{
					username: process.env.MEDICALADMIN_USERNAME,
					password: process.env.MEDICALADMIN_PASSWORD,
					role: process.env.MEDICALADMIN_ROLE,
				},
				{
					username: process.env.COW_USERNAME,
					password: process.env.COW_PASSWORD,
					role: process.env.COW_ROLE,
				},
				{
					username: process.env.H1_USERNAME,
					password: process.env.H1_PASSWORD,
					role: process.env.H1_ROLE,
				},
				// Other users removed for brevity
		  ];

const authController = async (req, res, next) => {
	try {
		console.log("Request body:", req.body);
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: "Username and password are required",
			});
		}

		let authResult;
		const foundDemoUser = demoUsers.find(
			(u) => u.username === username && u.password === password
		);
		if (foundDemoUser) {
			authResult = { status: true, role: foundDemoUser.role };
		} else {
			authResult = await authenticator.authenticate(username, password);
		}
		const { status, role } = authResult;

		if (!status) {
			return res.status(401).json({
				success: false,
				message: "Invalid Username or Password",
			});
		} else {
			// Create the JWT token for the user
			const token = generateToken({ username });
			const role_token = generateToken({ role });

			// Set the token as a secure, HTTP-only cookie
			res.cookie("jwt", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			});

			res.cookie("role", role_token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			});

			// Send response
			res.status(200).json({
				success: true,
				role: role,
				message: "User authenticated successfully",
			});
		}
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export default authController;
