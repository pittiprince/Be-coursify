# Coursify

This is the course-selling website's backend, where an admin (creator) can create their own courses and sell them online to end users, just like Udemy.

## Features

- **Admin/Creator**: 
  - Sign Up and Sign In to the platform.
  - Create, update, and delete courses.
  
- **Users**: 
  - Sign Up and Log In.
  - View all available courses.
  - Make transactions and purchase courses.

> **Note**: Payment integration has not been done yet!

## Tech Stack

- **Express**: For the HTTP server.
- **Mongoose**: For MongoDB connection.
- **JWT**: For secure authentication.
- **Bcrypt**: For password hashing.
- **Dotenv**: For environment variable management.

## To Run Locally

1. Create your own `.env` file using the provided `.env.example`.
2. Install all required modules:
   ```bash
   npm i
   npm start
   
 
