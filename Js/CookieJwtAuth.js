const jwt = require('jsonwebtoken');
SECRET = "BruhnsmanIsTheBest"
/**
 * checks if an JWT token is valid
 * 
 * @param {JSON} req - A JSON that Conatins an JWT token
 * @param {JSON} res - the response that is send to the Client 
 * @param next - continus the code
 */
function Auth (req, res, next){  
    const token = req.headers["auth"]
    try {
        const user = jwt.verify(token,SECRET);
        next();
    }
    catch (err) {
        return res.status(400).send(`Token is not Vaild: ${toString(err)}`);
    }
}

/**
 * checks if the Client allready has an valid JWT Token 
 * 
 * @param {JSON} req - A JSON that can Conatin a JWT token
 * @param {JSON} res - the response that is send to the Client 
 * @param next - continus the code
 */

function isLogedIn(req,res,next){
    try {
        const token = req.headers["auth"]
        const user = jwt.verify(token, SECRET)
        res.send("u are already logged in")
    } catch {
        next()
    }
}

/**
 * gets the User Data out of an JWT Token 
 * 
 * @param {*} token - A JWT token
 * @param {Object} - user data
 */

function getUser(token){  // returns the user information form the JWT cookie
    const user = jwt.verify(token, SECRET);
    return user;
}

module.exports = {Auth, getUser,isLogedIn};