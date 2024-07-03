const express = require("express"); // import express for REST API
const cookieParser = require("cookie-parser"); // import cookie parser for cookies
const login = require('./Login'); // import login.js file
const cookieJwtAuth = require('./CookieJwtAuth'); // import CookieJwtAuth.js file
const registration = require('./Registration'); // import Registration.js file
const cors = require('cors')
const checkDistance = require('./CheckDistance')

// DATABASE RELATED
const CreateQueries = require("./Database/CreateQueries.js")
const DeleteQueries = require("./Database/DeleteQueries.js")
const UpdateQueries = require("./Database/UpdateQueries.js")
const GetQueries = require("./Database/GetQueries.js")

const app = express(); // create app used for the Server 
const port = 5000; // connection port
const corsOption= {
    Credential: true
}
const maxRequestBodySize = '10mb'

//middleware
app.use(cors(corsOption))
app.use(express.json({limit: maxRequestBodySize})); // requiert to parse JSON form requests 
app.use(cookieParser()); // requiert to parse cookies
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  })

const server = app.listen(port, (error) => {           // starts the server on the port
    if (error) {
        console.log("Error running the server");
    }
    console.log("Server is running on port", port);
});

app.post('/login', cookieJwtAuth.isLogedIn,login);      // to log a user in
app.post('/register', registration);    // register a user

app.post('/checkAccount',GetQueries.getUserByEmailandUsername)

// -------------------- GETS -------------------- //

app.get("/getLocation/:id",GetQueries.getLocationById)
app.get("/getTicketDates/:id", GetQueries.getBookedTicketsDate)
app.get("/getArtistById/:id",GetQueries.getArtistByID)
app.get("/getCatererById/:id",GetQueries.getCatererById)
app.get("/getUserById/:id",GetQueries.getEndUserById)
app.get("/getLocationReview/:id",GetQueries.getLocationReviewById)
app.get("/getEventReview/:id",GetQueries.getEventReviewById)
app.get("/getPersonReview/:id",GetQueries.getPersonReviewById)
app.get('/getMails/:id', GetQueries.getMails)
app.get('/getEventById/:id', GetQueries.getEventById)
app.post('/searchEvent',GetQueries.searchEvent)  // searchs events with filter param
app.get('/tickets/:id', GetQueries.getAllTicketsFromUser)
app.get('/playlist/:name', GetQueries.getPlaylistContent)

app.post('/searchEvent',cookieJwtAuth.Auth,GetQueries.searchEvent)  // searchs events with filter param
app.post('/searchLoacation',cookieJwtAuth.Auth,GetQueries.searchLocaiton)  // searchs Locations with filter param
app.post('/searchCaterer',cookieJwtAuth.Auth,GetQueries.searchCaterer)  // searchs Caterer with filter param
app.post('/searchArtist',cookieJwtAuth.Auth,GetQueries.searchArtist)  // searchs Artist with filter param
app.post('/searchEndnutzer',cookieJwtAuth.Auth,GetQueries.searchEndUser)  // searchs Endnutzer with filter param

// -------------------- UPDATES -------------------- // 

app.post("/updateMail", async (req, res) => {
    console.log("REQUEST TO UPDATE mail")
    const {id, gelesen, angenommen} = req.body
    try {
        let result
        if (angenommen === undefined) result = await UpdateQueries.updateMail(id, gelesen)
        else result = await UpdateQueries.updateMail(id, true, angenommen)
        if (result.success) res.status(200).send("Updated mail")
        else res.status(200).send("Didn't update any mail")
    } catch (err) {
        res.status(500).send("INTERNAL SERVER ERROR WHILE TRYING TO UPDATE mail!")
    }
})

app.post("/updateArtist",async (req,res)=>{
    console.log("REQUEST TO UPDATE ARTIST",req.body)
    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung, songs} = req.body
    try {
        const resultArtist = await UpdateQueries.updateArtist(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung)
        let message = ""

        if (songs != null) {
            for(let song of songs) {
                const resultLied = await UpdateQueries.updateLied(song['id'], song['songName'], song['songLength'], song['songYear'])
                if (resultLied) message.concat(", UPDATED lied", song['songName'])
                else message.concat(", FAILED TO UPDATE lied", song['songName'])
            }
        }
        
        if (resultArtist.success) res.status(200).send("UPDATED artist" + message)
        else res.status(400).send("FAILED TO UPDATE artist! " + resultArtist.error + ", " + message)
    }
    catch(err) {
        console.error(err)
        res.status(500).send("Server error! " + err)
    }
})

app.post("/updateCaterer",async (req,res)=>{
    console.log("REQUEST TO UPDATE CATETER",req.body)
    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung, gerichte} = req.body
    try {
        const resultCaterer = await UpdateQueries.updateCaterer(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung)
        let message = ""

        if (gerichte != null) {
            for(let gericht of gerichte) {
                const resultGericht = await UpdateQueries.updateGericht(gericht['id'], gericht['dishName'], gericht['info1']+", "+gericht['info2'], gericht['imagePreview'])
                if (resultGericht.success) message.concat(", UPDATED gericht", gericht['dishName'])
                else message.concat(", FAILED TO UPDATE gericht", gericht['dishName'])
            }
        }

        if (resultCaterer.success) res.status(200).send("UPDATED CATERER" + message)
        else res.status(400).send("FAILED TO UPDATE caterer! " + resultCaterer.error + ", " + message)
    }
    catch(err) {
        console.error(err)
        res.status(500).send("Server error! " + err)
    }
})

app.post("/updateEndnutzer",async (req,res)=>{
    console.log("REQUEST TO UPDATE Endnutzer",req.body)
    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, email, alter, arten, lied, gericht, geschlecht, partybilder} = req.body
    try {
        const resultCaterer = await UpdateQueries.updateEndnutzer(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, alter, arten, lied, gericht, geschlecht, partybilder)

        if (resultCaterer.success) res.status(200).send("UPDATED CATERER")
        else res.status(400).send("FAILED TO UPDATE caterer! " + resultCaterer.error + ",")
    }
    catch(err) {
        console.error(err)
        res.status(500).send("Server error! " + err)
    }
})

app.post("/updateLoacation",(req,res)=>{
    console.log(req.body)
    const {locationid, adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet} = req.body
    try
    {
        UpdateQueries.updateLocation(locationid, adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet).then(result =>{
            if(result.success)
                {
                    res.status(200).send("Updatet Loacation")
                }
            else   {res.status(400).send("problem")}
        })
        
    }
    catch(err)
    {
        console.error(err)
        res.status(500).send("big Problem")
    }
    
})

//app.post("/updateEndnutzer")

// -------------------- CREATES -------------------- // 

app.post('/createEvent', async (req,res)=> {
    console.log("REQUEST TO CREATE EVENT",req.body)

    const {eventname,datum,uhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid} = req.body
    const result = await CreateQueries.createEvent(eventname,datum,uhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid)
    if (result.success) res.status(200).send("EVENT CREATED")
    else res.status(404).send("FAILED TO CREATE EVENT")
})    // creates a new events

app.post('/createCaterer', async (req,res)=> {
    console.log("REQUEST TO CREATE CATERER",req.body)
    const {benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, adresse, preis, kategorie, erfahrung, gerichte} = req.body
    const caterer = await CreateQueries.createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, adresse + ", " + region, preis, kategorie, erfahrung)

    if (caterer.success && gerichte != null) {
        console.log("RECIEVED GERICHTE", gerichte)
        
        for (let gericht of gerichte) {
            await CreateQueries.createGericht(caterer.id, gericht['dishName'], gericht['info1']+", "+gericht['info2'], gericht['imagePreview'])
        }
    }

    if (caterer.success) res.status(200).send("CATERER CREATED "+ caterer.id)
    else res.status(404).send("FAILED TO CREATE CATERER "+ caterer.error)
})    // creates a new Caterer

app.post('/createArtist', async (req,res)=> {
    console.log("REQUEST TO CREATE ARTIST",req.body)
    const {benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, adresse, preis, kategorie, erfahrung, songs} = req.body
    const artist = await CreateQueries.createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, adresse + ", " + region, preis, kategorie, erfahrung)
    
    if (artist.success && songs != null) {
        console.log("RECIEVED LIEDER", songs)

        for (let lied of songs) {
            await CreateQueries.createLied(artist.id, lied['songName'], lied['songLength'], lied['songYear'])
        }
    }
    
    if (artist.success) res.status(200).send("ARTIST CREATED "+ artist.id)
    else res.status(404).send("FAILED TO CREATE ARTIST "+ artist.error)
})    // creates a new Artist

app.post('/createLocation', async (req,res)=> {
    console.log("REQUEST TO CREATE LOCATION",req.body)
    const {adresse, region, name, beschreibung, ownerID, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild} = req.body // frontend is missing field 'privat'
    const result = await CreateQueries.createLocation(adresse + ", " + region, name, beschreibung, ownerID, true, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild)
    if (result.success) res.status(200).send("LOCATION CREATED")
    else res.status(404).send("FAILED TO CREATE LOCATION")
})    // creates a new Location



// -------------------- TESTS -------------------- // 

app.post('/testSearch', (req,res)=>{
    try
    {
        GetQueries.getStuffbyName(req).then(result =>{
            res.status(200).send(result);
        });
        
    }
    catch (err)
    {
        res.status(400).send(err)
    }
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

app.post('/testloc',async (req,res)=>{
    const {location1,location2,maxdis} = req.body
    try
    {
        const good = await checkDistance(location1,location2,maxdis)
        res.send(good) 
    }
    catch(err)
    {
        res.send(err)
    }

})

app.get("/MyPage",cookieJwtAuth.Auth, (req,res)=>{     // test function
    const user = cookieJwtAuth.getUser(req);
    res.status(200).send("Welcome "+user.id);
})

// -------------------- EXPORTS -------------------- // 

// export things for test
module.exports={app,server}