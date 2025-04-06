import appError from "../../utils/student/appError.js";

/**
 * Logout the user by clearing the session cookie.
 * @file ./controllers/logoutController.js
 * @module controllers/logoutController
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */


/**
 * Controller to handle user logout.
 * Clears the session cookie and sends a response indicating the logout status.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const logoutController = (req, res) => {
    try {
        res.clearCookie('jwt'); // Clear the session cookie
        Object.keys(req.cookies).forEach(cookie => res.clearCookie(cookie));
        // Add any other cookies you need to clear here

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred during logout', error: error.message });
    }
};

export default logoutController;