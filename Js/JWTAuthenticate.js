const jwt = require('jsonwebtoken');
const { comparePassword } = require('./Database/Database.js')
const { checkIfAccountIsInUse } = require("./Database/GetQueries.js")
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
        jwt.verify(token,SECRET);
        next();
    }
    catch (err) {
        return res.status(400).send({
            message: `Token is not Vaild, redirecting to login page: ` + err,
            url: 'https://eventureplattform.netlify.app/'
        });
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
        res.send("You are already logged in")
    } catch {
        next()
    }
}

/**
 * unpacks a token with the secret
 * @param {!string} token - A JWT token
 * @returns {JSON} the accessible information inside the token
 */
function unpackToken(token) {
    return jwt.verify(token, SECRET);
}

/**
 * creates a temporary token for registration if an account with given
 * credentials does not already exists
 * @param {!JSON} req 
 * @param {!JSON} res 
 * @returns 
 */
async function tempToken(req, res) {
    try {
        const exists = await checkIfAccountIsInUse(req.body['email'], req.body['benutzername'])
        if (exists.success && !exists.exists) {
            const token = jwt.sign(req.body, SECRET, {expiresIn: '0.5h'})
            return res.status(200).send(token)
        } else if (exists.success && exists.exists) {
            return res.status(200).send("Account already exists!")
        } else {
            throw new Error(exists.error)
        }
    } catch(err) {
        console.error(err)
        return res.status(500).send("Failed to create a temporary token: " + err)
    }
}

/**
 * checks if an account exist whit the given data and sends a JWT token back if successful
 * @param {JSON} req - A JSON that Conatins an Email and a Password
 * @param {JSON} res - the response that is send to the Client 
 */
async function login(req, res) {
    const {email, pass} = req.body
    try {
        console.log("LOGIN REQUEST WITH",req.body)
        const comparison = await comparePassword(email,pass);

        if (comparison.success && comparison.user != null) {
            const token = jwt.sign(comparison['user'],SECRET,{expiresIn: '3h'})
            return res.status(200).send(token)
        }
        else if (comparison.success && comparison.user == null) {
            return res.status(400).send("Wrong Password or Email")
        }
        else {
            return res.status(400).send("Couldn't find a User with the Email")
        }
    }
    catch(err) {
        console.error("LOGIN PROCEEDURE FAILED",err)
        return res.status(500).send("Server Error: " + err)
    }
}

module.exports = {
    Auth,
    getUser: unpackToken,
    isLogedIn,
    login,
    tempToken
}