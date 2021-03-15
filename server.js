const express = require('express');
const connectToDB = require('./config/db');
const app = express();

connectToDB();
app.use(express.json({ extended: false }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
