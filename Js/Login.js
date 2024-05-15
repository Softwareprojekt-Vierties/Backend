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
            console.log(user);
            return res.status(200).send(user);
        }
        else
        {
            console.log("Wrong Password");
            return res.status(400).send("Wrong Password");
            //const token = jwt.sign(user.id,secret,{expiresIn: '3h'});
            //res.cookie("token",token,{httpOnly:true});
            //return res.redirect('/home');
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(400).send("User not found");
    }
    
}