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
const maxRequestBodySize = '10mb'
//middleware
app.use(cors(corsOption))
app.use(express.json()); // requiert to parse JSON form requests 
app.use(cookieParser()); // requiert to parse cookies
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
app.use(express.urlencoded({limit: maxRequestBodySize}));


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

app.get("/getArtistById/:id",database.getArtistByID)
app.get("/getCatererById/:id",database.getCatererById)

app.post('/login', cookieJwtAuth.isLogedIn,login);      // to log a user in

app.get("/MyPage",cookieJwtAuth.Auth, (req,res)=>{     // test function
    const user = cookieJwtAuth.getUser(req);
    res.status(200).send("Welcome "+user.id);
})

app.post("/updateArtist",(req,res)=>{
    console.log(req.body)
    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung} = req.body
    try
    {
        database.updateArtist(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung).then(result =>{
            if(result)
                {
                    res.status(200).send("Updatet Artist")
                }
            else   {res.status(400).send("problem")}
        })
        
    }
    catch(err)
    {
        console.error(err)
        res.send(400).send("big Problem")
    }
    
})

app.post("/updateCaterer",(req,res)=>{
    console.log(req.body)
    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung} = req.body
    try
    {
        database.updateCaterer(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung).then(result =>{
            if(result)
                {
                    res.status(200).send("Updatet Caterer")
                }
            else   {res.status(400).send("problem")}
        })
        
    }
    catch(err)
    {
        console.error(err)
        res.send(400).send("big Problem")
    }
    
})

app.post("/updateLoacation",(req,res)=>{
    console.log(req.body)
    const {locationid, adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet} = req.body
    try
    {
        database.updateLocation(locationid, adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet).then(result =>{
            if(result)
                {
                    res.status(200).send("Updatet Loacation")
                }
            else   {res.status(400).send("problem")}
        })
        
    }
    catch(err)
    {
        console.error(err)
        res.send(400).send("big Problem")
    }
    
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

app.post('/createEvent', async (req,res)=> {
    console.log("REQUEST TO CREATE EVENT",req.body)
    const {eventname,datum,uhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid} = req.body
    const result = await database.createEvent(eventname,datum,uhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid)
    if (result) res.status(200).send("EVENT CREATED")
    else res.status(404).send("FAILED TO CREATE EVENT")
})    // creates a new events

app.post('/createCaterer', async (req,res)=> {
    console.log("REQUEST TO CREATE CATERER",req.body)
    const {benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, adresse, preis, kategorie, erfahrung, gerichte} = req.body
    const caterer = await database.createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, adresse + ", " + region, preis, kategorie, erfahrung)

    if (caterer.success && gerichte != null) {
        console.log("RECIEVED GERICHTE", gerichte)
        
        for (let gericht of gerichte) {
            await database.createGericht(caterer.id, gericht[0], gericht[1]+", "+gericht[2], gericht[3])
        }
    }

    if (caterer.success) res.status(200).send("CATERER CREATED "+ caterer.id)
    else res.status(404).send("FAILED TO CREATE CATERER "+ caterer.error)
})    // creates a new Caterer

app.post('/createArtist', async (req,res)=> {
    console.log("REQUEST TO CREATE ARTIST",req.body)
    const {benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, adresse, preis, kategorie, erfahrung} = req.body
    const result = await database.createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, adresse + ", " + region, preis, kategorie, erfahrung)
    if (result) res.status(200).send("ARTIST CREATED")
    else res.status(404).send("FAILED TO CREATE ARTIST")
})    // creates a new Artist

app.post('/createLocation', async (req,res)=> {
    console.log("REQUEST TO CREATE LOCATION",req.body)
    const {adresse, region, name, beschreibung, ownerID, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild} = req.body // frontend is missing field 'privat'
    const result = await database.createLocation(adresse + ", " + region, name, beschreibung, ownerID, true, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild)
    if (result) res.status(200).send("LOCATION CREATED")
    else res.status(404).send("FAILED TO CREATE LOCATION")
})    // creates a new Location

const server = app.listen(port, (error) => {           // starts the server on the port
    if (error) {
        console.log("Error running the server");
    }
    console.log("Server is running on port", port);
});

// export things for test
module.exports={app,server};
