/**
 * @file LDAP Authenticator module.
 * @module utils/LdapAuthenticator
 */
import ldap from "ldapjs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Class representing an LDAP Authenticator.
 */
class LdapAuthenticator {
	/**
	 * Create an LDAP Authenticator.
	 * @param {string} baseDN - The base DN for LDAP.
	 * @param {Object} options - Configuration options for LDAP client.
	 */
	constructor(baseDN, options = {}) {
		this.baseDN = baseDN;
		this.options = options;
	}

	/**
	 * Create a new LDAP client with improved error handling.
	 * @returns {ldap.Client} - The LDAP client.
	 */
	createClient() {
		return ldap.createClient({
			url: process.env.LDAP_URL || "ldap://localhost:389",
			timeout: 5000, // 5 second connection timeout
			connectTimeout: 5000, // 5 second connect timeout
			idleTimeout: 10000, // 10 second idle timeout
			tlsOptions: this.options.tlsOptions || { rejectUnauthorized: false },
			reconnect: {
				initialDelay: 100,
				maxDelay: 1000,
				failAfter: 3,
			},
		});
	}

	/**
	 * Authenticate a user against the LDAP server with improved error handling.
	 * @param {string} username - The username to authenticate.
	 * @param {string} password - The password for the user.
	 * @returns {Promise<boolean>} - A promise that resolves to true if authentication is successful, otherwise false.
	 */
	async authenticate(username, password) {
		const client = this.createClient();

		// Set up error handlers
		client.on("error", (err) => {
			console.error("Student LDAP Client Error:", err.message);
			try {
				client.unbind();
			} catch (e) {
				console.error("Error unbinding student client:", e.message);
			}
		});

		client.on("connectTimeout", (err) => {
			console.error(
				"Student LDAP Connection Timeout:",
				err?.message || "Connection timed out"
			);
		});

		client.on("socketTimeout", (err) => {
			console.error(
				"Student LDAP Socket Timeout:",
				err?.message || "Socket timed out"
			);
		});

		// Construct user DN dynamically
		const userDN = `uid=${username},ou=Students,${this.baseDN}`;

		return new Promise((resolve, reject) => {
			// Set a timeout for the bind operation itself
			const bindTimeout = setTimeout(() => {
				console.error("Student LDAP bind operation timed out");
				try {
					client.unbind();
				} catch (e) {
					console.error(
						"Error unbinding student client after timeout:",
						e.message
					);
				}
				resolve(false);
			}, 10000); // 10 second bind timeout

			client.bind(userDN, password, (err) => {
				clearTimeout(bindTimeout);

				if (err) {
					console.error("Student bind error:", err.message);
					try {
						client.unbind();
					} catch (e) {
						console.error(
							"Error unbinding student client after bind error:",
							e.message
						);
					}
					return resolve(false); // Authentication failed
				}

				console.log("Student authentication successful");
				try {
					client.unbind();
				} catch (e) {
					console.error(
						"Error unbinding student client after successful auth:",
						e.message
					);
				}
				return resolve(true); // Authentication successful
			});
		});
	}
}

export default LdapAuthenticator;
