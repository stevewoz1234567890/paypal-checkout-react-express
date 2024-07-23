const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const PORT = process.env.PORT || 5000;;
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';

const connectDB = require("./config/db");

const app = express();

// Init Middleware
app.use(bodyParser.json());
app.use(express.json());

// Connect Database
connectDB();

//Add Cors
app.use(cors());
app.options('*', cors());

app.get('/', (req, res) => res.send('API Running'));


// Define Routes
app.use('/api/user', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/orders', require('./routes/api/orders'));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});