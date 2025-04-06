// LDAP_AUTHENTICATOR.JS
import ldap from "ldapjs";
import dotenv from "dotenv";
dotenv.config();

class LdapAuthenticator {
	constructor(baseDN, options = {}) {
		this.baseDN = baseDN;
		this.options = options;
	}

	async authenticate(username, password) {
		// Create client with timeout and reconnect options
		const client = ldap.createClient({
			url: process.env.LDAP_URL || "ldap://localhost:389",
			timeout: 5000, // 5 second connection timeout
			connectTimeout: 5000, // 5 second connect timeout
			idleTimeout: 10000, // 10 second idle timeout
			tlsOptions: this.options.tlsOptions || { rejectUnauthorized: false }, // Only use in dev or with proper certs
			reconnect: {
				initialDelay: 100,
				maxDelay: 1000,
				failAfter: 3,
			},
		});

		// Set up error handlers
		client.on("error", (err) => {
			console.error("LDAP Client Error:", err.message);
			try {
				client.unbind();
			} catch (e) {
				console.error("Error unbinding client:", e.message);
			}
		});

		client.on("connectTimeout", (err) => {
			console.error(
				"LDAP Connection Timeout:",
				err?.message || "Connection timed out"
			);
		});

		client.on("socketTimeout", (err) => {
			console.error("LDAP Socket Timeout:", err?.message || "Socket timed out");
		});

		const userDN = `cn=${username},${this.baseDN}`;
		const status = await new Promise((resolve, reject) => {
			// Set a timeout for the bind operation itself
			const bindTimeout = setTimeout(() => {
				console.error("LDAP bind operation timed out");
				try {
					client.unbind();
				} catch (e) {
					console.error("Error unbinding client after timeout:", e.message);
				}
				resolve(false);
			}, 10000); // 10 second bind timeout

			client.bind(userDN, password, (err) => {
				clearTimeout(bindTimeout);

				if (err) {
					console.error("Bind error:", err.message);
					try {
						client.unbind();
					} catch (e) {
						console.error(
							"Error unbinding client after bind error:",
							e.message
						);
					}
					return resolve(false);
				}

				console.log("Authentication successful");
				try {
					client.unbind();
				} catch (e) {
					console.error(
						"Error unbinding client after successful auth:",
						e.message
					);
				}
				return resolve(true);
			});
		});

		let role = null;
		const userMap = [
			{ un: process.env.ADMIN_USERNAME, rl: process.env.ADMIN_ROLE },
			{
				un: process.env.ELECTRICADMIN_USERNAME,
				rl: process.env.ELECTRICADMIN_ROLE,
			},
			{
				un: process.env.INTERNETADMIN_USERNAME,
				rl: process.env.INTERNETADMIN_ROLE,
			},
			{
				un: process.env.MEDICALADMIN_USERNAME,
				rl: process.env.MEDICALADMIN_ROLE,
			},
			{ un: process.env.COW_USERNAME, rl: process.env.COW_ROLE },
			{ un: process.env.H1_USERNAME, rl: process.env.H1_ROLE },
			{ un: process.env.H2_USERNAME, rl: process.env.H2_ROLE },
			{ un: process.env.H3_USERNAME, rl: process.env.H3_ROLE },
			{ un: process.env.H4_USERNAME, rl: process.env.H4_ROLE },
			{ un: process.env.H5_USERNAME, rl: process.env.H5_ROLE },
			{ un: process.env.H6_USERNAME, rl: process.env.H6_ROLE },
			{ un: process.env.H7_USERNAME, rl: process.env.H7_ROLE },
			{ un: process.env.H8_USERNAME, rl: process.env.H8_ROLE },
			{ un: process.env.H9_USERNAME, rl: process.env.H9_ROLE },
			{ un: process.env.H10_USERNAME, rl: process.env.H10_ROLE },
			{ un: process.env.H11_USERNAME, rl: process.env.H11_ROLE },
			{ un: process.env.H12_USERNAME, rl: process.env.H12_ROLE },
		];

		for (const u of userMap) {
			if (username === u.un) {
				role = u.rl;
				break;
			}
		}

		return { status, role };
	}
}

export default LdapAuthenticator;
