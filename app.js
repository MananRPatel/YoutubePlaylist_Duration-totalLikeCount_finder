const express = require('express');
const app = express();
const cors = require('cors')
const router = require('./router/youtube');
require('dotenv').config();
const port = process.env.PORT || 3000

app.use('/',router);
app.use(express.json())
app.use(cors())

app.use(express.json());
app.listen(port,()=>{
console.log(` server running on http://localhost:${process.env.PORT}`);
}); 