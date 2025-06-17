# Trip Tailor - Travel Management Platform

Trip Tailor is a dynamic, full-stack web application designed as a personalized travel management platform. It empowers users to search for real-time flight and hotel data, build a custom travel itinerary, and simulate a complete booking process.

## Core Features
*   **Live Travel Search:** Integrates with the live Amadeus API for real-time flight and hotel data.
*   **Secure Authentication:** Full user registration and login system with CAPTCHA protection.
*   **Automated Email Confirmations:** Server-side email system (using Nodemailer) sends instant welcome, order, and feedback emails.
*   **Dynamic UI:** Built with Vanilla JavaScript to handle API data, interactive modals, and shopping cart management.

## Tech Stack
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **Backend:** Node.js, Express.js
*   **Database:** File-based JSON (`db.json`)
*   **APIs & Services:** Amadeus API, Nodemailer, Google Translate

## Setup & Installation
1. Clone the repository.
2. Run `npm install` to install backend dependencies.
3. Create a `.env` file and add your API keys and email credentials.
4. Run `node server.js` to start the server.