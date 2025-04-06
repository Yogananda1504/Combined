# Profile Controller

## `getProfileDetails`

### Description
Fetches the profile details of a user based on the scholar number provided by the authentication middleware.



### Parameters
- `req` (Object): The request object containing the scholar number.
- `res` (Object): The response object used to send back the HTTP response.
- `next` (Function): The next middleware function in the stack.

### Returns
- **Success Response (200)**:
  - `success` (Boolean): Indicates the success of the operation.
  - `message` (String): Success message.
  - `data` (Object): The profile details of the user.

- **Error Response (404)**:
  - `success` (Boolean): Indicates the failure of the operation.
  - `message` (String): Error message indicating user not found.

- **Error Response (500)**:
  - `success` (Boolean): Indicates the failure of the operation.
  - `message` (String): Error message indicating an internal server error.

### Example Usage
```javascript
import { getProfileDetails } from './controllers/profileController.js';

// Example route using Express.js
app.get('/profile', getProfileDetails);
```