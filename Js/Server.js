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
const port =  process.env.PORT || 5000; // connection port
const corsOption= {
    credentials: true
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

const clientQueue = new Map()
const MAX_QUEUE_SIZE = 4

// Middleware to identify the client
app.use((req, res, next) => {
    const clientId = req.ip;

    if (!clientQueue.has(clientId)) {
        clientQueue.set(clientId, []); // Initialize a queue for the client if not exist
    }

    req.clientId = clientId; // Attach clientId to request
    next();
});

// Middleware to process client requests one at a time
app.use((req, res, next) => {
    const clientId = req.clientId;
    const clientRequests = clientQueue.get(clientId);

    if (clientRequests.length >= MAX_QUEUE_SIZE) {
        // If the queue is full, send a 429 Too Many Requests response
        res.status(429).send('Too Many Requests - Please try again later');
    } else {
        const processRequest = () => {
            const nextRequest = clientRequests.shift();
            if (nextRequest) {
                nextRequest();
            }
        };

        clientRequests.push(() => {
            res.on('finish', () => {
                processRequest(); // When response is finished, process the next request
                // Remove the current request from the queue
                const index = clientRequests.indexOf(processRequest);
                if (index > -1) {
                    clientRequests.splice(index, 1);
                }
            });

            // Proceed to the actual route handler
            next();
        });

        if (clientRequests.length === 1) {
            processRequest(); // Start processing if this is the only request in the queue
        }
    }
});

let server

if (process.env.NODE_ENV !== 'test') {
    server = app.listen(port, (error) => {           // starts the server on the port
        if (error) console.log("Error running the server", error)
        console.log("Server is running on port", port)
    })
}

app.post('/login', isLogedIn, login)      // to log a user in
app.post('/tempToken', tempToken)

// -------------------- GETS -------------------- //

app.get("/getUserById/:id",GetQueries.getEndUserById)
app.get("/getLocationReview/:id",GetQueries.getLocationReviewById)
app.get("/getEventReview/:id",GetQueries.getEventReviewById)
app.get("/getPersonReview/:id",GetQueries.getPersonReviewById)
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

// -------------------- CREATES -------------------- // 

app.post('/createCaterer', Auth, async (req,res)=> {
    console.log("REQUEST TO CREATE CATERER",req.body)
    const benutzername = await getUser(req.headers['auth'])['benutzername']
    const email = await getUser(req.headers['auth'])['email']
    const password = await getUser(req.headers['auth'])['password']

    console.log(benutzername, email, password)

    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, adresse, preis, kategorie, erfahrung, gerichte} = req.body

    if (
        benutzername == undefined ||
        email == undefined ||
        password == undefined ||
        profilname == undefined ||
        profilbild == undefined ||
        kurzbeschreibung == undefined ||
        beschreibung == undefined ||
        region == undefined ||
        adresse == undefined ||
        preis == undefined ||
        kategorie == undefined ||
        erfahrung == undefined ||
        gerichte == undefined
    ) return res.status(400).send("INVALID DATA GIVEN!")

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
    const benutzername = await getUser(req.headers['auth'])['benutzername']
    const email = await getUser(req.headers['auth'])['email']
    const password = await getUser(req.headers['auth'])['password']

    console.log(benutzername, email, password)

    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, adresse, preis, kategorie, erfahrung, songs} = req.body
    
    if (
        benutzername == undefined ||
        email == undefined ||
        password == undefined ||
        profilname == undefined ||
        profilbild == undefined ||
        kurzbeschreibung == undefined ||
        beschreibung == undefined ||
        region == undefined ||
        adresse == undefined ||
        preis == undefined ||
        kategorie == undefined ||
        erfahrung == undefined ||
        songs == undefined
    ) return res.status(400).send("INVALID DATA GIVEN!")
    
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
    console.log("REQUEST TO CREATE endnutzer",req.body)
    const benutzername = await getUser(req.headers['auth'])['benutzername']
    const email = await getUser(req.headers['auth'])['email']
    const password = await getUser(req.headers['auth'])['password']

    console.log(benutzername, email, password)

    const {profilname, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht, partybilder} = req.body
    
    if (
        benutzername == undefined ||
        email == undefined ||
        password == undefined ||
        profilname == undefined ||
        profilbild == undefined ||
        kurzbeschreibung == undefined ||
        beschreibung == undefined ||
        region == undefined ||
        alter == undefined ||
        arten == undefined ||
        lied == undefined ||
        gericht == undefined ||
        geschlecht == undefined ||
        partybilder == undefined
    ) return res.status(400).send("INVALID DATA GIVEN!")
    
    await CreateQueries.createEndUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht, partybilder).then(result => {
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

app.post("/changeFavorite",Auth,async (req,res)=>{
    let userid
    try {
        userid = getUser(req.headers["auth"])["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    const {type,id,istfav} = req.body
    switch(type)
    {
        case "events":
            
            if(istfav) 
            {
                result = await CreateQueries.createFavoritEvent(userid,id)
                if (result.success) res.status(200).send("FAVORIT CREATED")
                else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
                break
            }
            else
            {
                result = await DeleteQueries.deleteFavoritEvent(id,userid)
                if (result.success) res.status(200).send("FAVORIT DELETED")
                else res.status(500).send("FAILED TO DELETE FAVORIT " + toString(result.error))
                break
            }
        case "location":
            if(istfav) 
                {
                    result = await CreateQueries.createFavoritLocation(userid,id)
                    if (result.success) res.status(200).send("FAVORIT CREATED")
                    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
                    break
                }
                else
                {
                    result = await DeleteQueries.deleteFavoritLocation(id,userid)
                    if (result.success) res.status(200).send("FAVORIT DELETED")
                    else res.status(500).send("FAILED TO DELETE FAVORIT " + toString(result.error))
                    break
                }
            
        case "person":
            if(istfav) 
                {
                    result = await CreateQueries.createFavoritEndUser(userid,id)
                    if (result.success) res.status(200).send("FAVORIT CREATED")
                    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
                }
                else
                {
                    result = await DeleteQueries.deleteFavoritUser(id,"enduser",userid)
                    if (result.success) res.status(200).send("FAVORIT DELETED")
                    else res.status(500).send("FAILED TO DELETE FAVORIT " + toString(result.error))
                }
            break
        case "artist":
            if(istfav) 
                {
                    result = await CreateQueries.createFavoritArtist(userid,id)
                    if (result.success) res.status(200).send("FAVORIT CREATED")
                    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
                }
                else
                {
                    result = await DeleteQueries.deleteFavoritUser(id,"artist",userid)
                    if (result.success) res.status(200).send("FAVORIT DELETED")
                    else res.status(500).send("FAILED TO DELETE FAVORIT " + toString(result.error))
                }
            break
        case "caterer":
            if(istfav) 
                {
                    result = await CreateQueries.createFavoritCaterer(userid,id)
                    if (result.success) res.status(200).send("FAVORIT CREATED")
                    else res.status(500).send("FAILED TO CREATE FAVORIT " + toString(result.error))
                }
                else
                {
                    result = await DeleteQueries.deleteFavoritUser(id,"catere",userid)
                    if (result.success) res.status(200).send("FAVORIT DELETED")
                    else res.status(500).send("FAILED TO DELETE FAVORIT " + toString(result.error))
                }
            break
            
    }
    
    
})

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

// -------------------- DELETES -------------------- //

app.get("/deleteFriend/:id",Auth,DeleteQueries.deletefriend)

app.get("/deleteEndUser", Auth, async (req,res) => {
    console.log("REQUEST TO DELETE enduser",req.body)
    let user
    try {
        user = getUser(req.headers["auth"])
        if (user == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    DeleteQueries.deleteTicketsById(user['id'], 'ownerid')                          //tickets
    DeleteQueries.deleteBildById(user['bildid'])                                    //bild
    DeleteQueries.deletePartybilderById(user['id'])                                 //partybilder
    DeleteQueries.deleteFavorites(user['id'])                                       //favorit_*
    DeleteQueries.deleteFriends(user['id'])                                         //friend
    DeleteQueries.deleteMails(user['id'])                                           //mail
    for (let event of await DeleteQueries.deleteEventById(user['id'], 'ownerid')) { //event
        DeleteQueries.deleteTicketsById(event['id'], 'eventid')                     //tickets
        DeleteQueries.deleteServiceArtistById(event['id'], 'eventid')               //serviceartist
        DeleteQueries.deleteServiceCatererById(event['id'], 'eventid')              //servicecaterer
        DeleteQueries.deleteReviewById(event['id'], 'eventid')                      //review (for event)
    }
    for (let location of await DeleteQueries.deleteLocationById(user['id'], 'ownerid')) {//location
        DeleteQueries.deleteReviewById(location['id'], 'locationid')                //review (for location)
    }                         
    DeleteQueries.deleteReviewById(user['id'], 'userid')                            //review (for user)
    DeleteQueries.deleteReviewById(user['id'], 'ownerid')                           //review (from user)
    DeleteQueries.deleteEndnutzerById(user['email'], 'email')                       //endnutzer
    DeleteQueries.deleteAppUserById(user['id'], 'id')                               //app_user
    DeleteQueries.deletePasswordById(user['password'])                              //password
    console.log("Delete Cylce done!")
    res.status(200).send("Account deleted!")
})

app.get("/deleteArtist", Auth, async (req, res) => {
    console.log("REQUEST TO DELETE enduser",req.body)
    let user
    try {
        user = getUser(req.headers["auth"])
        if (user == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    DeleteQueries.deleteTicketsById(user['id'], 'ownerid')                          //tickets
    DeleteQueries.deleteBildById(user['bildid'])                                    //bild
    DeleteQueries.deleteFavorites(user['id'])                                       //favorit_*
    DeleteQueries.deleteFriends(user['id'])                                         //friend
    DeleteQueries.deleteMails(user['id'])                                           //mail
    for (let event of await DeleteQueries.deleteEventById(user['id'], 'ownerid')) { //event
        DeleteQueries.deleteTicketsById(event['id'], 'eventid')                     //tickets
        DeleteQueries.deleteServiceArtistById(event['id'], 'eventid')               //serviceartist(from event)
        DeleteQueries.deleteServiceCatererById(event['id'], 'eventid')              //servicecaterer(from event)
        DeleteQueries.deleteReviewById(event['id'], 'eventid')                      //review (for event)
    }
    for (let location of await DeleteQueries.deleteLocationById(user['id'], 'ownerid')) {//location
        DeleteQueries.deleteReviewById(location['id'], 'locationid')                //review (for location)
    }                         
    DeleteQueries.deleteReviewById(user['id'], 'userid')                            //review (for user)
    DeleteQueries.deleteReviewById(user['id'], 'ownerid')                           //review (from user)
    DeleteQueries.deleteServiceArtistById(user['id'], 'artistid')                   //serviceartist(from user)
    DeleteQueries.deleteLiedById(user['id'], 'ownerid')                             //lied
    DeleteQueries.deleteArtistById(user['email'], 'email')                          //artist
    DeleteQueries.deleteAppUserById(user['id'], 'id')                               //app_user
    DeleteQueries.deletePasswordById(user['password'])                              //password
    console.log("Delete Cylce done!")
    res.status(200).send("Account deleted!")
})

app.get("/deleteCaterer", Auth, async (req,res) => {
    console.log("REQUEST TO DELETE enduser",req.body)
    let user
    try {
        user = getUser(req.headers["auth"])
        if (user == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    DeleteQueries.deleteTicketsById(user['id'], 'ownerid')                          //tickets
    DeleteQueries.deleteBildById(user['bildid'])                                    //bild
    DeleteQueries.deleteFavorites(user['id'])                                       //favorit_*
    DeleteQueries.deleteFriends(user['id'])                                         //friend
    DeleteQueries.deleteMails(user['id'])                                           //mail
    for (let event of await DeleteQueries.deleteEventById(user['id'], 'ownerid')) { //event
        DeleteQueries.deleteTicketsById(event['id'], 'eventid')                     //tickets
        DeleteQueries.deleteServiceArtistById(event['id'], 'eventid')               //serviceartist(from event)
        DeleteQueries.deleteServiceCatererById(event['id'], 'eventid')              //servicecaterer(from event)
        DeleteQueries.deleteReviewById(event['id'], 'eventid')                      //review (for event)
    }
    for (let location of await DeleteQueries.deleteLocationById(user['id'], 'ownerid')) {//location
        DeleteQueries.deleteReviewById(location['id'], 'locationid')                //review (for location)
    }                         
    DeleteQueries.deleteReviewById(user['id'], 'userid')                            //review (for user)
    DeleteQueries.deleteReviewById(user['id'], 'ownerid')                           //review (from user)
    DeleteQueries.deleteServiceCatererById(user['id'], 'catererid')                 //servicecaterer(from user)
    DeleteQueries.deleteGerichtById(user['id'], 'ownerid')                          //gericht
    DeleteQueries.deleteCatererById(user['email'], 'email')                         //artist
    DeleteQueries.deleteAppUserById(user['id'], 'id')                               //app_user
    DeleteQueries.deletePasswordById(user['password'])                              //password
    console.log("Delete Cylce done!")
    res.status(200).send("Account deleted!")
})

// -------------------- EXPORTS -------------------- // 

// export things for test
module.exports={app,server}