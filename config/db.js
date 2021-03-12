const dotenv = require('dotenv').config();
const mongoose = require('mongoose');

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
        });

        console.log('MongoDB Connected!!');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectToDB;