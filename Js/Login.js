require('dotenv').config();
const jwt = require('jsonwebtoken');
const Database = require('./Database.js');


module.exports = async(req, res) => {
    const {email, pass} = req.body;
    try
    {
        const user  = await Database.getUserByEmail(email,pass);
        if(user!=null)
        {
            const token = jwt.sign(user,process.env.SECRET,{expiresIn: '3h'});
            return res.status(200).send(token);
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