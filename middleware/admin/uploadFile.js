/**
 * @module middleware/uploadFile
 * @file Middleware for handling file uploads.
 * @exports handleFileUpload
 **/

import multer from "multer";
import path from "path";
import appError from "../../utils/admin/appError.js";
import crypto from "crypto";
import fs from "fs";

// Allowed file types with stricter validation
const allowedMimeTypes = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"application/pdf": [".pdf"],
};

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configure Multer for local storage with randomized filenames.
 */
const storage = multer.diskStorage({
	destination: (_, __, cb) => {
		cb(null, uploadsDir);
	},
	filename: (_, file, cb) => {
		// Generate a random filename with original extension
		const randomName = crypto.randomBytes(16).toString("hex");
		const fileExt = path.extname(file.originalname).toLowerCase();
		cb(null, `${randomName}${fileExt}`);
	},
});

/**
 * File filter to validate file types with enhanced security.
 */
const fileFilter = (_, file, cb) => {
	// Sanitize the original filename for logging
	const sanitizedFilename = path
		.basename(file.originalname)
		.replace(/[^\w\d.-]/g, "_");

	// Validate file extension matches content type
	const ext = path.extname(sanitizedFilename).toLowerCase();
	const allowedExts = allowedMimeTypes[file.mimetype];

	if (!allowedExts) {
		console.warn(
			`Admin rejected file: invalid mimetype ${file.mimetype} for ${sanitizedFilename}`
		);
		return cb(
			new appError(
				"Invalid file type! Only JPEG, PNG, and PDF files are allowed.",
				400
			)
		);
	}

	if (!allowedExts.includes(ext)) {
		console.warn(
			`Admin rejected file: extension mismatch for ${sanitizedFilename} (${file.mimetype})`
		);
		return cb(new appError("File extension doesn't match content type.", 400));
	}

	console.log(
		`Admin valid file upload: ${sanitizedFilename} (${file.mimetype})`
	);
	cb(null, true);
};

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5 MB limit
		files: 5, // Maximum 5 files per upload
	},
	fileFilter: fileFilter,
}).array("attachments", 5);

/**
 * Middleware for handling file uploads.
 * @param {Object} req - Request object.
 * @param {Object} res - Response object.
 * @param {Function} next - Next middleware function.
 */
const handleFileUpload = (req, res, next) => {
	upload(req, res, (err) => {
		if (err instanceof multer.MulterError) {
			console.error(`Admin Multer error: ${err.message}`);
			return next(new appError(`File upload error: ${err.message}`, 400));
		} else if (err) {
			console.error(`Admin upload error: ${err.message}`);
			return next(new appError(`File upload failed: ${err.message}`, 400));
		}

		// If upload is successful, attach API path for the files
		if (req.files && req.files.length > 0) {
			req.filePaths = req.files.map((file) => {
				// Get the basename and construct the API path
				const baseName = path.basename(file.path);
				return `/api/admin/uploads/${baseName}`;
			});
			console.log(`Admin uploaded ${req.files.length} files for ${req.path}`);
		} else {
			req.filePaths = [];
		}

		next();
	});
};

export default handleFileUpload;
