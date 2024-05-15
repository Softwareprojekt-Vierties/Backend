const jwt = require('jsonwebtoken');
const Database = require('./Database.js');
const secret = "BruhnsmanIsTheBest"

module.exports = async(req, res) => {
    const {email, pass} = req.body;
    try
    {
        const user  = await Database.getUserByEmail(email,pass);
        if(user!=null)
        {
            const token = jwt.sign(user,secret,{expiresIn: '3h'});
            res.cookie("token",token,{httpOnly:true});
            return res.status(200).send("Logged in");
        }
        else
        {
            console.log("Wrong Password");
            return res.status(400).send("Wrong Password");
            
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(400).send("User not found");
    }
    
}