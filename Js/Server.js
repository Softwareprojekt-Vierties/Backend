const express = require("express"); // import express for REST API
const cookieParser = require("cookie-parser"); // import cookie parser for cookies
const multer = require('multer') 

const storage = multer.memoryStorage()
const upload = multer({ dest: 'uploads/' }); // Dateien werden im 'uploads' Verzeichnis gespeichert
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

app.get("/getLocation/:id",database.getLocationById)

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

app.get('/tickets/:id', (req,res)=>{
    try
    {       
        database.getAllTicketsFromUser(req.params["id"]).then(result =>{
            res.status(200).send(result);
        });
        
    }
    catch (err)
    {
        res.status(400).send(err)
    }
});

app.get('/event/artist/:id', (req,res)=>{
    try
    {       
        database.getArtistByEvent(req.params["id"]).then(result =>{
            res.status(200).send(result);
        });
        
    }
    catch (err)
    {
        res.status(400).send(err)
    }
});

app.get('/event/caterer/:id', (req,res)=>{
    try
    {       
        database.getCatererByEvent(req.params["id"]).then(result =>{
            res.status(200).send(result);
        });
        
    }
    catch (err)
    {
        res.status(400).send(err)
    }
})

app.get('/playlist/:name', (req,res)=>{
    try
    {       
        database.getPlaylistContent(req.params["name"]).then(result =>{
            res.status(200).send(result);
        });
        
    }
    catch (err)
    {
        res.status(400).send(err)
    }
})

app.post('/checkAccount',async(req,res)=>{
    const {email, benutzername} = req.body;
    try
    {
        const user  = await database.getUserByEmailandUsername(email,benutzername);
        if(user.rowCount>0)
        {
            res.status(200).send("1");
        }
        else
        {
            res.status(400).send("0");
            
        }
    }
    catch(err)
    {
        console.log(err)
        res.status(404).send("err")
    }
})

app.post('/searchEvent',database.searchEvent);  // searchs events with filter param
app.post('/searchLoacation',database.searchLocaiton);  // searchs Locations with filter param
app.post('/searchCaterer',database.searchCaterer);  // searchs Caterer with filter param
app.post('/searchArtist',database.searchArtist);  // searchs Artist with filter param

app.post('/createEvent', upload.single('bild'), (req,res)=>{
    const {eventname,datum,uhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,ownerid,locationid} = req.body
    const bild = req.file
    database.createEvent(eventname,datum,uhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid)
    res.status(200).send("event")
})    // creates a new events

app.post('/createCaterer',(req,res)=>{
    const {benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung} = req.body
    database.createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung)
    res.status(200).send("Caterer")
})    // creates a new Caterer

app.post('/createArtist',(req,res)=>{
    const {benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung} = req.body
    database.createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung)
    res.status(200).send("Artist")
})    // creates a new Artist

app.post('/createLocation', upload.single('bild'),(req,res)=>{
    console.log(req.body)
    console.log(req.file)
    const {adresse, region, name, beschreibung, ownerID, kurzbeschreibung, preis, kapazitaet, openair, flaeche} = req.body // frontend is missing field 'privat'
    const bild = req.file
    database.createLocation(adresse + " " + region, name, beschreibung, ownerID, true, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild)
    res.status(200).send("Location")
})    // creates a new Location

const server = app.listen(port, (error) => {           // starts the server on the port
    if (error) {
        console.log("Error running the server");
    }
    console.log("Server is running on port", port);
});

// export things for test
module.exports={app,server};
