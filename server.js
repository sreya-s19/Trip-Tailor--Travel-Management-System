// server.js - FINAL VERSION WITH ALL FEATURES

require('dotenv').config();
const express = require("express");
const path = require("path");
const fs = require('fs').promises;
const nodemailer = require('nodemailer');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 3000;

const DB_PATH = path.join(__dirname, 'db.json');

// --- Helper Functions for JSON Database ---
async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeDB({ users: {}, orders: {} });
            return { users: {}, orders: {} };
        }
        throw error;
    }
}

async function writeDB(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}


// --- Registration Email Function ---
async function sendConfirmationEmail(userEmail, userName) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: `"Trip Tailor" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to Trip Tailor! Your account is ready.',
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;"><h2>Hi ${userName},</h2><p>Welcome to Trip Tailor! Your account has been successfully created.</p><p>You can now log in and start planning your next great adventure.</p><br><p>Happy travels,</p><p><b>The Trip Tailor Team</b></p></div>`,
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration confirmation email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error('❌ Error sending registration email:', error);
  }
}


// --- Order Confirmation Email Function ---
async function sendOrderConfirmationEmail(user, orderDetails) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemsHtml = orderDetails.items.map(item => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>`
    ).join('');

    const mailOptions = {
      from: `"Trip Tailor" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Your Trip Tailor Order is Confirmed! (ID: ${orderDetails.orderId})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Hi ${user.name},</h2>
          <p>Thank you for your booking! We've received your order and are getting everything ready for your trip.</p>
          <h3 style="border-bottom: 2px solid #0a9396; padding-bottom: 5px;">Order Summary</h3>
          <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
          <p><strong>Purchase Date:</strong> ${new Date(orderDetails.purchaseDate).toLocaleDateString()}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left;">Item</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; font-weight: bold; text-align: right;">Total:</td>
                <td style="padding: 10px; font-weight: bold; text-align: right;">$${orderDetails.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p style="margin-top: 30px;">You can always view your order history by logging into your account on our website.</p>
          <br>
          <p>Happy travels,</p>
          <p><b>The Trip Tailor Team</b></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent successfully to ${user.email}`);
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
  }
}


// --- Feedback Email Function ---
async function sendFeedbackEmail(username, feedbackMessage) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Trip Tailor Feedback" <${process.env.EMAIL_USER}>`,
      to: process.env.FEEDBACK_RECIPIENT_EMAIL, // Sending to your feedback email
      subject: `New Feedback from ${username}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Feedback Received</h2>
          <p><strong>From User:</strong> ${username}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p style="padding: 10px; background-color: #f4f4f4; border-radius: 5px;">
            <em>${feedbackMessage}</em>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Feedback email sent successfully from ${username}`);
  } catch (error) {
    console.error('❌ Error sending feedback email:', error);
  }
}


// Amadeus API credentials from .env file
const CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

// --- Reusable Helper function to get Amadeus Access Token ---
async function getAmadeusToken() {
    const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Amadeus auth failed: ${JSON.stringify(errorData)}`);
    }
    const data = await response.json();
    return data.access_token;
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- API Routes ---

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post('/api/users/register', async (req, res) => {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    const db = await readDB();
    if (db.users[username]) {
        return res.status(409).json({ message: 'Username already exists.' });
    }
    const newUser = { name, email, username, password };
    db.users[username] = newUser;
    await writeDB(db);
    sendConfirmationEmail(email, name);
    res.status(201).json({ name, email, username });
});

app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    const db = await readDB();
    const user = db.users[username];
    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password.' });
    }
    res.status(200).json({
        name: user.name,
        email: user.email,
        username: user.username
    });
});

app.post('/api/orders', async (req, res) => {
    const { username, items, totalAmount } = req.body;
    if (!username || !items || totalAmount === undefined) {
        return res.status(400).json({ message: 'Missing order information.' });
    }
    const db = await readDB();
    if (!db.users[username]) {
        return res.status(404).json({ message: 'User not found.' });
    }
    const user = db.users[username]; // Get full user object for name and email

    if (!db.orders[username]) {
        db.orders[username] = [];
    }
    const newOrder = {
        orderId: `TRIP-${Date.now()}`,
        purchaseDate: new Date().toISOString(),
        items,
        totalAmount
    };
    db.orders[username].push(newOrder);
    await writeDB(db);

    // Call the order confirmation email function
    sendOrderConfirmationEmail(user, newOrder);

    res.status(201).json(newOrder);
});

app.get('/api/orders/:username', async (req, res) => {
    const { username } = req.params;
    const db = await readDB();
    if (!db.users[username]) {
        return res.status(404).json({ message: 'User not found.' });
    }
    const userOrders = db.orders[username] || [];
    res.status(200).json(userOrders);
});

app.post('/api/feedback', async (req, res) => {
    const { username, message } = req.body;
    if (!username || !message) {
        return res.status(400).json({ message: 'Missing username or feedback message.' });
    }
    sendFeedbackEmail(username, message);
    res.status(200).json({ message: 'Feedback received. Thank you!' });
});


// Search for Flights
app.post("/api/search-flights", async (req, res) => {
    console.log("Received flight search request with body:", req.body);
    const { origin, destination, date } = req.body;
    if (!origin || !destination || !date) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const accessToken = await getAmadeusToken();
        const flightRes = await fetch("https://test.api.amadeus.com/v2/shopping/flight-offers", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                currencyCode: "USD",
                originDestinations: [ { id: "1", originLocationCode: origin, destinationLocationCode: destination, departureDateTimeRange: { date: date } } ],
                travelers: [{ id: "1", travelerType: "ADULT" }],
                sources: ["GDS"]
            }),
        });
        const flightData = await flightRes.json();
        res.json(flightData);
    } catch (error) {
        console.error("Error in /api/search-flights:", error);
        res.status(500).json({ error: "Failed to fetch flights from Amadeus API." });
    }
});

// Search for Hotels
app.post("/api/search-hotels", async (req, res) => {
    console.log("Received hotel search request with body:", req.body);
    const { cityCode, checkInDate, checkOutDate } = req.body;
    if (!cityCode) {
        return res.status(400).json({ error: "Missing city code" });
    }
    try {
        const accessToken = await getAmadeusToken();
        const listRes = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=10&hotelSource=ALL`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!listRes.ok) throw new Error('Failed to retrieve hotel list for the city.');
        const listData = await listRes.json();
        if (!listData.data || listData.data.length === 0) {
            return res.json({ data: [] });
        }
        const hotelIds = listData.data.slice(0, 5).map(hotel => hotel.hotelId).join(',');
        const offersUrl = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds}&adults=1` +
                          (checkInDate ? `&checkInDate=${checkInDate}` : '') +
                          (checkOutDate ? `&checkOutDate=${checkOutDate}` : '');
        const offersRes = await fetch(offersUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!offersRes.ok) throw new Error('Failed to retrieve hotel offers.');
        const offersData = await offersRes.json();
        res.json(offersData);
    } catch (error) {
        console.error("Error in /api/search-hotels:", error);
        res.status(500).json({ error: "Failed to fetch hotels from Amadeus API." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});