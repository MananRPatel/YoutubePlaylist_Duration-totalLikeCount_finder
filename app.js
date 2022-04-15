const express = require('express');
const app = express();
const router = require('./router/youtube');
require('dotenv').config();
const port = process.env.PORT || 3000

app.use('/',router);


app.listen(port,()=>{
console.log(` server running on http://localhost:${process.env.PORT}`);
}); 