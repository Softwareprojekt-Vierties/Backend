const jwt = require('jsonwebtoken')
const { comparePassword } = require('./Database/Database.js')
SECRET = "BruhnsmanIsTheBest"

module.exports = async(req, res) => {
    const {email, pass} = req.body
    try {
        console.log("LOGIN REQUEST WITH",req.body)
        const comparison = await comparePassword(email,pass);
        console.log(comparison)

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
        return res.status(500).send("Server Error")
    }
}