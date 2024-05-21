require('dotenv').config();
const jwt = require('jsonwebtoken');

function Auth (req, res, next){     //checks if there is a JWT cookie 
    const token = req.headers.Auth
    console.log(token)
    try {
        const user = jwt.verify(token, process.env.SECRET);
        next();
    }
    catch (err) {
        return res.send("NOOOOOO");
    }
}

function getUser(req){  // returns the user information form the JWT cookie
    const token = req.cookies.token;
    const user = jwt.verify(token, process.env.SECRET);
        return user;
}

module.exports = {Auth, getUser};