# README.md content
# README.md

# Auth App

This project implements a Node.js application for user authentication, including login and signup functionality with email, phone, and password, as well as OTP verification via email using Nodemailer.

## Features

- User signup and login
- OTP verification via email
- Input validation
- Middleware for authentication

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd auth-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your environment variables for database and email configurations.

## Usage

1. Start the application:
   ```
   npm start
   ```

2. Use the following endpoints for authentication:
   - `POST /api/auth/signup` - for user registration
   - `POST /api/auth/login` - for user login
   - `POST /api/auth/verify-otp` - for OTP verification

## License

This project is licensed under the ISC License.