const jwt = require('jsonwebtoken');
SECRET = "BruhnsmanIsTheBest"

function Auth (req, res, next){     //checks if there is a JWT cookie 
    const token = req.headers["auth"]
    try {
        const user = jwt.verify(token,SECRET);
        next();
    }
    catch (err) {
        return res.send("NOOOOOO");
    }
}

function isLogedIn(req,res,next){
    try
    {
        const token = req.headers["auth"]
        const user = jwt.verify(token, SECRET)
        res.send("u are already logged in")
    }
    catch
    {
        next()
    }
}

function getUser(token){  // returns the user information form the JWT cookie
    const user = jwt.verify(token, SECRET);
        return user;
}

module.exports = {Auth, getUser,isLogedIn};