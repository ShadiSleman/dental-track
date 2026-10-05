// Vercel Serverless Function — mounts the full Express app
require('dotenv').config()
const app = require('../server/src/app')
module.exports = app
