const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (!mongoURI) {
    console.warn(
      'MONGODB_URI is not set; skipping MongoDB. Auth and user routes will not work until it is configured.'
    );
    return;
  }
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });

    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;