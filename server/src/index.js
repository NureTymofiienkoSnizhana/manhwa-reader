// This is the entry point of our server application
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const config = require('./config/config');
