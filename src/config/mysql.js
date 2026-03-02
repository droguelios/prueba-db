const {mongoClient} = require ('mongodb');

require('dotenv').config();

const pool = mysql.createPwol({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password:process.env.DB_PASS,
    database:process.env.DB_NAME,
    waitforconnetions: true ,
    connetionLimit: 10
});

module.exports=pool;