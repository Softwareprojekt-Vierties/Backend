const CreateQueries = require('./Database/CreateQueries');

/**
 * trys to Create a new Account in the Database with Data the Client sended
 * 
 * @param {JSON} req - A JSON that Conatins an Email and a Password and a name 
 * @param {JSON} res - the response that is send to the Client 
 * @returns {JSON} Status of the operation 
 */
module.exports = async (req, res) => {
    const {email,pass,name} = req.body;
    await CreateQueries.createEndUser(name,"User_"+name,email,pass,null,null,null,null,18,null,null,null,null).then(result => {
        if(result.success) {return res.status(200).send("User created")}
        else{ return res.status(500).send("User not created: " + result.error)} 
    });
}