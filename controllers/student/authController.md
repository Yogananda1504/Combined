The authController is responsible for handling user authentication. It verifies the user's credentials using LDAP and generates a JWT token upon successful authentication.
# Auth Controller Documentation

## Dependencies
- **appError**: Custom error handling class from `utils/appError.js`.
- **generateToken**: Function to generate JWT tokens from `utils/tokenUtils.js`.
- **dotenv**: Module to load environment variables from a `.env` file.
- **Ldap_authenticator**: Class for LDAP authentication from `utils/Ldap_authenticator.js`.

## Environment Variables
- **LDAP_BASE_DN**: Base DN for LDAP.
- **NODE_ENV**: Environment (e.g., production).
- **JWT_SECRET**: Secret key for JWT.
- **JWT_EXPIRES_IN**: Expiration time for JWT.

## Functionality

### Request Body
- **username**: The username of the user.
- **password**: The password of the user.

### Process
1. **Input Validation**: Checks if username and password are provided.
2. **LDAP Authentication**: Uses `Ldap_authenticator` to authenticate the user.
3. **JWT Token Generation**: If authentication is successful, generates a JWT token using `generateToken`.
4. **Set Cookie**: Sets the JWT token as a secure, HTTP-only cookie.
5. **Response**: Sends a JSON response indicating successful authentication.

## Error Handling
- If username or password is missing, responds with a 401 error.
- If LDAP authentication fails, responds with a 401 error.
- If any other error occurs, responds with a 500 error.
