const express = require('express');
const connectToDB = require('./config/db');
const path = require('path');

const app = express();

connectToDB();

app.get('/', (req, res) => res.send('api Runnig'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
