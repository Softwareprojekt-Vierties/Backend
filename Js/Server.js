const express = require("express"); // import express for REST API
const cookieParser = require("cookie-parser"); // import cookie parser for cookies
const { Auth,getUser,isLogedIn,login,tempToken} = require('./CookieJwtAuth.js'); // import CookieJwtAuth.js file
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

app.post('/login', isLogedIn, login)      // to log a user in
app.post('/tempToken', tempToken)

// -------------------- DELETES -------------------- //

app.get("/deleteEndUser/:id", Auth, (req,res) => {
    console.log("REQUEST TO DELETE enduser",req.body)
    let user
    try {
        user = getUser(req.headers["auth"])
        if (user == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    DeleteQueries.deleteTicketsById(user['id'], 'ownerid')
    DeleteQueries.deleteBildById(user['bildid'])
    DeleteQueries.deletePartybilderById(user['id'])
    DeleteQueries.deleteFavorites(user['id'])
    DeleteQueries.deleteFriends(user['id'])
    DeleteQueries.deleteMails(user['id'])
    DeleteQueries.deleteEventById(user['id'], 'ownerid')
    DeleteQueries.deleteLocationById(user['id'], 'ownerid')
    
})


// -------------------- GETS -------------------- //

app.get("/getUserById/:id",GetQueries.getEndUserById)
app.get("/getLocationReview/:id",GetQueries.getLocationReviewById)
app.get("/getEventReview/:id",GetQueries.getEventReviewById)
app.get("/getPersonReview/:id",GetQueries.getPersonReviewById)
app.get('/playlist/:name', GetQueries.getPlaylistContent)
app.get('/getPartybilder/:id', GetQueries.getPartybilderFromUser)

app.get('/getfriends',Auth,GetQueries.getFriendId)
app.get('/getEventById/:id', Auth,GetQueries.getEventById)
app.get("/getArtistById/:id",Auth,GetQueries.getArtistByID)
app.get("/getCatererById/:id",Auth,GetQueries.getCatererById)
app.get("/getTicketDates", Auth, GetQueries.getBookedTicketsDate)
app.get('/tickets', Auth, GetQueries.getAllTicketsFromUser)
app.get('/getMails', Auth, GetQueries.getMails)
app.get("/getLocation/:id", Auth, GetQueries.getLocationById)

app.post('/searchEvent',Auth,GetQueries.searchEvent)  // searchs events with filter param
app.post('/searchLoacation',Auth,GetQueries.searchLocaiton)  // searchs Locations with filter param
app.post('/searchCaterer',Auth,GetQueries.searchCaterer)  // searchs Caterer with filter param
app.post('/searchArtist',Auth,GetQueries.searchArtist)  // searchs Artist with filter param
app.post('/searchEndnutzer',Auth,GetQueries.searchEndUser)  // searchs Endnutzer with filter param

// -------------------- UPDATES -------------------- // 

app.post("/updateArtist", Auth, async (req,res)=>{
    console.log("REQUEST TO UPDATE ARTIST",req.body)
    let userEmail
    try {
        userEmail = getUser(req.headers["auth"])["email"]
        if (userEmail == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung, songs} = req.body
    try {
        const resultArtist = await UpdateQueries.updateArtist(profilname, profilbild, kurzbeschreibung, beschreibung, region, userEmail, preis, kategorie, erfahrung)
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
        res.status(500).send("Server error! " + toString(err))
    }
})

app.post("/updateCaterer", Auth, async (req,res)=>{
    console.log("REQUEST TO UPDATE CATETER",req.body)
    let userEmail
    try {
        userEmail = getUser(req.headers["auth"])["email"]
        if (userEmail == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung, gerichte} = req.body
    try {
        const resultCaterer = await UpdateQueries.updateCaterer(profilname, profilbild, kurzbeschreibung, beschreibung, region, userEmail, preis, kategorie, erfahrung)
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
        res.status(500).send("Server error! " + toString(err))
    }
})

app.post("/updateEndnutzer", Auth, async (req,res)=>{
    console.log("REQUEST TO UPDATE Endnutzer",req.body)
    let userEmail
    try {
        userEmail = getUser(req.headers["auth"])["email"]
        if (userEmail == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht, partybilder} = req.body
    try {
        const resultEndnutzer = await UpdateQueries.updateEndnutzer(profilname, profilbild, kurzbeschreibung, beschreibung, region, userEmail, alter, arten, lied, gericht, geschlecht, partybilder)
        if (resultEndnutzer.success) res.status(200).send("UPDATED Endnutzer")
        else res.status(400).send("FAILED TO UPDATE Endnutzer! " + resultEndnutzer.error + ",")
    }
    catch(err) {
        console.error(err)
        res.status(500).send("Server error! " + toString(err))
    }
})

app.post("/updateLocation", Auth, (req,res)=>{
    console.log(req.body)
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    const {locationid, adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet} = req.body
    try
    {
        UpdateQueries.updateLocation(userid, locationid, adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet).then(result =>{
            if(result.success) {
                res.status(200).send("Updated Location")
            } else if (result.error === "Unauthorized") {
                res.status(401).send("User is not authorized to edit the given location!")
            } else {
                res.status(400).send("Update Location failed: " + toString(result.error))
            }
        })
    }
    catch(err)
    {
        console.error(err)
        res.status(500).send("Server error! " + toString(err))
    }
})

app.post("/updateMail", Auth, async (req, res) => {
    console.log("REQUEST TO UPDATE mail")
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 
    const {id, gelesen, angenommen} = req.body

    try {
        let result
        if (angenommen === undefined) result = await UpdateQueries.updateMail(userid, id, gelesen)
        else result = await UpdateQueries.updateMail(userid, id, true, angenommen)
        if (result.success) res.status(200).send("Updated mail")
        else res.status(200).send("Didn't update any mail")
    } catch (err) {
        res.status(500).send("INTERNAL SERVER ERROR WHILE TRYING TO UPDATE mail!")
    }
})

// -------------------- CREATES -------------------- // 

app.post('/createCaterer', Auth, async (req,res)=> {
    console.log("REQUEST TO CREATE CATERER",req.body)
    const benutzername = req.headers['auth']['benutzername']
    const email = req.headers['auth']['email']
    const password = req.headers['auth']['password']
    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, adresse, preis, kategorie, erfahrung, gerichte} = req.body
    const caterer = await CreateQueries.createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, adresse + ", " + region, preis, kategorie, erfahrung)

    if (caterer.success && gerichte != null) {
        console.log("RECIEVED GERICHTE", gerichte)
        
        for (let gericht of gerichte) {
            await CreateQueries.createGericht(caterer.id, gericht['dishName'], gericht['info1']+", "+gericht['info2'], gericht['imagePreview'])
        }
    }

    if (caterer.success) res.status(200).send("CATERER CREATED "+ caterer.id)
    else res.status(500).send("FAILED TO CREATE CATERER "+ toString(caterer.error))
})    // creates a new Caterer

app.post('/createArtist', Auth, async (req,res)=> {
    console.log("REQUEST TO CREATE ARTIST",req.body)
    const benutzername = req.headers['auth']['benutzername']
    const email = req.headers['auth']['email']
    const password = req.headers['auth']['password']
    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, adresse, preis, kategorie, erfahrung, songs} = req.body
    const artist = await CreateQueries.createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, adresse + ", " + region, preis, kategorie, erfahrung)
    
    if (artist.success && songs != null) {
        console.log("RECIEVED LIEDER", songs)

        for (let lied of songs) {
            await CreateQueries.createLied(artist.id, lied['songName'], lied['songLength'], lied['songYear'])
        }
    }
    
    if (artist.success) res.status(200).send("ARTIST CREATED "+ artist.id)
    else res.status(500).send("FAILED TO CREATE ARTIST "+ toString(artist.error))
})    // creates a new Artist

app.post('/createEndnutzer', Auth, async (req,res) => {
    console.log("REQUEST TO CREATE ARTIST",req.body)
    const benutzername = req.headers['auth']['benutzername']
    const email = req.headers['auth']['email']
    const password = req.headers['auth']['password']
    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht} = req.body
    await CreateQueries.createEndUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht).then(result => {
        if(result.success) return res.status(200).send("User created")
        else return res.status(500).send("User not created: " + result.error)
    })
})

app.post('/createEvent', Auth, async (req,res)=> {
    console.log("REQUEST TO CREATE EVENT",req.body)
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    const {name,datum,startuhrzeit,enduhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,locationid, serviceProviders} = req.body
    const result = await CreateQueries.createEvent(name,datum,startuhrzeit,enduhrzeit,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,userid,locationid, serviceProviders)
    if (result.success) res.status(200).send({
        message: "EVENT CREATED",
        providerInfo: result.providerInfo
    })
    else res.status(500).send("FAILED TO CREATE EVENT " + toString(result.error))
})    // creates a new events

app.post('/createLocation', Auth, async (req,res)=> {
    console.log("REQUEST TO CREATE LOCATION",req.body)
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }

    const {adresse, region, name, beschreibung, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild} = req.body // frontend is missing field 'privat'
    const result = await CreateQueries.createLocation(adresse + ", " + region, name, beschreibung, userid, true, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild)
    if (result.success) res.status(200).send("LOCATION CREATED")
    else res.status(500).send("FAILED TO CREATE LOCATION " + toString(result.error))
})    // creates a new Location

app.post("/setFriend",Auth,async (req,res)=>{
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    const freundid = req.body["freundid"]
    result = await CreateQueries.createFriend(userid,freundid)
    if (result.success) res.status(200).send("FRIEND CREATED")
    else res.status(500).send("FAILED TO CREATE FRIEND " + toString(result.error))
})

app.post("/createTicket",Auth,async (req,res)=>{
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    const eventid = req.body["eventid"]
    result = await CreateQueries.createTicket(userid,eventid)
    if (result.success) res.status(200).send("TICKET CREATED")
    else res.status(500).send("FAILED TO CREATE TICKET " + toString(result.error))
})

app.post("/createFavouritEvent",Auth,async (req,res)=>{
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    const eventid = req.body["eventid"]
    result = await CreateQueries.createFavoritEvent(userid,eventid)
    if (result.success) res.status(200).send("FAVORIT CREATED")
    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
})

app.post("/createFavouritLocation",Auth,async (req,res)=>{
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    const locataionid = req.body["locationid"]
    result = await CreateQueries.createFavoritLocation(userid,locataionid)
    if (result.success) res.status(200).send("FAVORIT CREATED")
    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
})

app.post("/createFavouritEndUser",Auth,async (req,res)=>{
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    const enduserid = req.body["enduserid"]
    result = await CreateQueries.createFavoritEndUser(userid,enduserid)
    if (result.success) res.status(200).send("FAVORIT CREATED")
    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
})

app.post("/createFavouritArtist",Auth,async (req,res)=>{
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    const artistid = req.body["artistid"]
    result = await CreateQueries.createFavoritArtist(userid,artistid)
    if (result.success) res.status(200).send("FAVORIT CREATED")
    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
})

app.post("/createFavouritCaterer",Auth,async (req,res)=>{
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    const catererid = req.body["catererid"]
    result = await CreateQueries.createFavoritCaterer(userid,catererid)
    if (result.success) res.status(200).send("FAVORIT CREATED")
    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
})
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
        res.status(500).send(err)
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

app.get("/MyPage",Auth, (req,res)=>{     // test function
    const user = getUser(req);
    res.status(200).send("Welcome "+user.id);
})
// -------------------- DELETE --------------------- //
app.get("/deleteFriend/:id",Auth,DeleteQueries.deletefriend)
// -------------------- EXPORTS -------------------- // 

// export things for test
module.exports={app,server}