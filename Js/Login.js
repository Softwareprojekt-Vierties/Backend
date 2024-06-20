const jwt = require('jsonwebtoken');
const { comparePassword } = require('./Database/Database.js');
SECRET = "BruhnsmanIsTheBest"


module.exports = async(req, res) => {
    const {email, pass} = req.body;
    try
    {
        console.log("LOGIN REQUEST WITH",req.body)
        const user = await comparePassword(email,pass);
        console.log(user)
        if(user!=null)
        {
            const token = jwt.sign(user,SECRET,{expiresIn: '3h'});
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
        console.error(err);
        return res.status(400).send("User not found");
    }
    
}