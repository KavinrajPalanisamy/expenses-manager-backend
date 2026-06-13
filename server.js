require('dotenv').config({ quiet: true });
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const { connectDatabase } = require('./config/dbConfig');


// Import Routes
const statusCheck = require('./routes/healthCheck');


// Assign Routes Path
app.use('/app', statusCheck);


app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
