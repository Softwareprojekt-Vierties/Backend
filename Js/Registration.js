const Database = require('./Database.js');

module.exports = async (req, res) => {

    const {email,pass,name} = req.body;
    if(Database.createEndUser(name,"test",email,pass,null,null,null,null,18,null,null,null,null))
    {
        return res.status(200).send("User created");  
    }
    else
    {
        return res.status(400).send("User not created");  
    }

     


}