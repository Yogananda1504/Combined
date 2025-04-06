import csrf from "@dr.pogodin/csurf";
import dotenv from "dotenv";
dotenv.config();

const csrfProtection = csrf({
	cookie: {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "Strict",
		maxAge: 3600000, // 1 hour expiration
	},
});

export default csrfProtection;
