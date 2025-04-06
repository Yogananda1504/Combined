# Complain Controller

This document provides an overview of the functions available in the `complainController.js` file. Each function handles different aspects of complaint management in the system.



## Functions

### 1. `registerComplain`
Registers a new complaint.

#### Request
- **Method**: POST
- **Body Parameters**:
    - `complainType`: Type of the complaint (required)
    - `complainDescription`: Description of the complaint (required)
    - `attachments`: Attachments related to the complaint (required)
    - `hostelNumber`: Hostel number of the student (required)
    - `studentName`: Name of the student (required)
    - `scholarNumber`: Scholar number of the student (required)
    - `room`: Room number of the student (optional)

#### Response
- **Status**: 200
- **Body**:
    - `success`: Boolean indicating success
    - `message`: Success message

#### Errors
- **Status**: 400
    - Missing required fields
    - Complaint registration failed
- **Status**: 500
    - Internal server error

### 2. `getComplaints`
Fetches complaints based on the scholar number.

#### Request
- **Method**: GET
- **Query Parameters**:
    - `sn`: Scholar number (required)

#### Response
- **Status**: 200
- **Body**:
    - `complaints`: Array of complaints

#### Errors
- **Status**: 500
    - Internal server error

### 3. `updateComplaints`
Performs bulk updates on complaints.

#### Request
- **Method**: PUT
- **Body Parameters**:
    - `updates`: Array of update objects, each containing:
        - `complainId`: ID of the complaint to update (required)
        - Other fields to update (optional)

#### Response
- **Status**: 200
- **Body**:
    - `success`: Boolean indicating success
    - `message`: Success message
    - `data`: Array of updated complaints

#### Errors
- **Status**: 400
    - Zero updates
    - Missing complain ID
- **Status**: 500
    - Internal server error

### 4. `deleteComplaints`
Deletes a complaint based on its ID.

#### Request
- **Method**: DELETE
- **Query Parameters**:
    - `complainId`: ID of the complaint to delete (required)

#### Response
- **Status**: 200
- **Body**:
    - `success`: Boolean indicating success
    - `message`: Success message

#### Errors
- **Status**: 400
    - Missing complain ID
- **Status**: 404
    - Complaint not found
- **Status**: 500
    - Internal server error