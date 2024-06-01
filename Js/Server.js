
const express = require("express"); // import express for REST API
const cookieParser = require("cookie-parser"); // import cookie parser for cookies
const app = express(); // create app used for the Server 
const port = 5000; // connection port
const login = require('./Login'); // import login.js file
const cookieJwtAuth = require('./CookieJwtAuth'); // import CookieJwtAuth.js file
const registration = require('./Registration'); // import Registration.js file
const database = require("./Database")
const cors = require('cors')
const corsOption= {
    Credential: true
}
//middleware
app.use(cors(corsOption))
app.use(express.json()); // requiert to parse JSON form requests 
app.use(cookieParser()); // requiert to parse cookies
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });


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

app.post('/login', cookieJwtAuth.isLogedIn,login);      // to log a user in

app.get("/MyPage",cookieJwtAuth.Auth, (req,res)=>{     // test function
    const user = cookieJwtAuth.getUser(req);
    res.status(200).send("Welcome "+user.id);
})

app.post('/register', registration);    // register a user

app.post('/testSearch', (req,res)=>{
    try
    {
        database.getStuffbyName(req).then(result =>{
            res.status(200).send(result);
        });
        
    }
    catch (err)
    {
        res.status(400).send(err)
    }
});

app.post('/search.caterer',(req,res) =>{
    try
    {
        database.getCatererByName(req.body["name"]).then(result =>{
            res.status(200).send(result);
        });
        
    }
    catch (err)
    {
        res.status(400).send(err)
    }
})

app.post('/event',(req,res)=>{
    const {eventname,datum,uhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid} = req.body
    database.createEvent(eventname,datum,uhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid)
    res.status(200).send("event")
})    // searchs events with filter param

app.listen(port, (error) => {           // starts the server on the port
    if (error) {
        console.log("Error running the server");
    }
    console.log("Server is running on port", port);
});
