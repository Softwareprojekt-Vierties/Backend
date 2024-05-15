const express = require("express"); // import express for REST API
const app = express(); // create app used for the Server 
const port = 5000; // connection port
const login = require('./Login'); // import login.js file

app.use(express.json()); // requiert to parse JSON form requests 

app.get('/test/:id', (req,res)=>{    // test get function
   const {id} = req.params;
   if(id >= 10)
    {
       res.status(200).send("lets goo");
    }
    else
    {
        res.status(200).send("ur id is: ",id);
    }
});

app.post('/testpost/:id', (req,res)=>{
    const {id} = req.params;
    const {servus} = req.body;
    res.status(200).send("ur id is: "+id+" and ur body is: "+servus);
});

app.post('/login', (req,res)=>{
    const {user,pass} = req.body;
    if(login.Auth(user,pass))
    {
        res.status(200).send("Login successfull");
    }
    else
    {
        req.redirect('/login');
    }
});


app.listen(port, (error) => {           // starts the server on the port
    if (error) {
        console.log("Error running the server");
    }
    console.log("Server is running on port", port);
});