const express = require("express"); // import express for REST API
const app = express(); // create app used for the Server 
const port = 8080; // connection port

app.use(express.json()); // requiert to parse JSON form requests 

app.get("/test:id", (req,res)=>{
    const {id} = req.params;
    res.send("ur id is" + id);

})

app.listen(port, (error) => {           // start the server on the port
    if (error) {
        console.log("Error running the server");
    }
    console.log("Server is running on port", port);
});