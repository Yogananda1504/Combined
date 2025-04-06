import dotenv from "dotenv";
dotenv.config();

export const csrf = {
	secret:
		process.env.CSRF_SECRET ||
		"your-very-secure-and-long-secret-key-that-should-be-in-env",
	cookieName: "csrfToken",
	headerName: "x-csrf-token",
	cookieOptions: {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "Strict",
		maxAge: 3600000, // 1 hour expiration
	},
};
