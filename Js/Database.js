const { response } = require('express');
const bcrypt = require('bcrypt');
const {Pool} = require('pg');


const pool = new Pool({
    host: 'dpg-cp2a9l6n7f5s73fe0sv0-a.frankfurt-postgres.render.com',
    user: 'eventuredb_user',
    port: 5432,
    password: 'mkzjH3FLbXfVtZwtEwJxcxyvAkt8wUuk',
    database: 'eventuredb',
    max: 20,
    ssl: true,
    connectionTimeoutMillis: 20000,
    idelTimeoutMillis: 10000,
    allowExitOnIdle: false
});

async function comparePassword(email, password) {
    try {
        const result = await pool.query(
            "SELECT * FROM app_user WHERE email = $1::text",
            [email]
        )

        bcrypt.compare(password, result.rows[4], (err, res) => {
            if (err) {
                console.log('Error comparing passwords:', err)
                return null
            }
            if (result) {
                console.log('User authenticated!')
                return result
            }
            console.log('Authentication failed.')
            return null
        })
    } catch (err) {
        console.log(err)
        return null
    }
}

// ------------------------- CREATE - QUERIES ------------------------- //

// private
async function createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region){
    try {
        const res = await pool.query(
            "INSERT INTO app_user (benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region) VALUES ($1::text, $2::text, $3::text, $4::text, $5, $6::text, $7::text, $8::text)",
            [benutzername, profilname, email, bcrypt.hash(password), profilbild, kurzbeschreibung, beschreibung, region])
        console.log("app_user created")
        return true;
    } catch (err) {
        console.log(err)
        return false
    }
}

// public
async function createEndUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht){
    // create app_user first
    await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)
    // create enduser afterwards
    try {
        const res = await pool.query(
            "INSERT INTO endnutzer (emailfk, alter, arten, lied, gericht, geschlecht) VALUES ($1::text, $2::int, $3::text, $4::text, $5::text, $6::text)",
            [email, alter, arten, lied, gericht, geschlecht]
        )
        console.log("enduser created")
        return true
    } catch (err) {
        console.log(err)
        return false
    }
    
}

// public
async function createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)
    // create artist afterwards
    try {
        const res = await pool.query(
            "INSERT INTO artist (emailfk, preis, kategorie, erfahrung) " + 
            "VALUES ($1::text, $2::text, $3::text, $4::text)",
            [email,preis,kategorie,erfahrung]
        )
        console.log("artist created")
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// public
async function createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)
    // create caterer afterwards
    try {
        const res = await pool.query(
            "INSERT INTO caterer (emailfk, preis, kategorie, erfahrung) " + 
            "VALUES ($1::text, $2::text, $3::text, $4::text)",
            [email,preis,kategorie,erfahrung]
        )
        console.log("Caterer created")
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// public
async function createLocation(addresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche){
    try {   
        const res = await pool.query(
            "INSERT INTO location (addresse, name, beschreibung, ownerid, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche) " + 
            "VALUES ($1::text, $2::text, $3::text; $4::int, $5::bool, $6::text, $7::text, $8::text, $9::bool, $10::text)",
            [addresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche]
        )
        console.log("location Created")
        return ture
    } catch(err) {
        console.log(err)
        return false
    }
}

// public
async function createReviewEvent(inhalt, sterne, ownerid, eventid){
    try {
        const res = await pool.query(
            "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
            "VALUES ($1::text,$2::int,$3::int,$4::int,$5,$6)", 
            [inhalt,sterne,ownerid,eventid,null,null]
        )
        console.log("Review for Event Created")
        return ture
    } catch(err) {
        console.log(err)
        return false
    }
}

// public
async function createReviewUser(inhalt, sterne, ownerid, userid){
    try {
        const res = await pool.query(
            "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
            "VALUES ($1::text,$2::int,$3::int,$4,$5::int,$6)",
            [inhalt,sterne,ownerid,null,userid,null]
        )
        console.log("Review for User Created")
        return ture
    } catch(err) {
        console.log(err)
        return false
    }
}

// public
async function createReviewLocation(inhalt, sterne, ownerid, locationid){
    try {
        const res = await pool.query(
            "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
            "VALUES ($1::text,$2::int,$3::int,$4,$5,$6::int)",
            [inhalt,sterne,ownerid,null,null,locationid]
        )
        console.log("Review for Location Created")
        return ture
    } catch(err) {
        console.log(err)
        return false
    }
}

// public
async function createEvent(name, datum, uhrzeit, eventgroesse, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid){
    try {
        const res = await pool.query(
            "INSERT INTO event (name, datum, uhrzeit, eventgroesse, freietickets, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid) " + 
            "VALUES ($1::text, $2, $3::int, $4::int, $5::int, $6::int, $7::int, $8::bool, $9::text, $10::text, $11, $12::int, $13::int)",
            [name,datum,uhrzeit,eventgroesse,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid]
        )
        console.log("Event Created")
        return ture
    } catch(err) {
        console.log(err)
        return false
    }
}

// public 
async function createServiceArtist(eventid, artistid){
    try {
        const res = await pool.query(
            "INSERT INTO serviceartist (eventid, artistid) VALUES ($1::int,$2::int)",
            [eventid,artistid]
        )
        console.log("Service Artist Created")
        return ture
    } catch(err) {
        console.log(err)
        return false
    }
}

// public
async function createLied(ownerid,name,laenge,erscheinung){
    try {
        const res = await pool.query(
            "INSERT INTO lied (ownerid, name, laenge, erscheinung) VALUES ($1::int, $2::text, $3::int, $4::date)",
            [ownerid,name,laenge,erscheinung]
        )
        console.log("Lied created")
        return ture
    } catch(err) {
        console.log(err)
        return false
    }
}

// public
async function createGericht(ownerid=null,name,beschreibung,bild=null){
    try {
        const result = await pool.query(
            "INSERT INTO gericht (ownerid,name,beschreibung,bild) VALUES ($1, $2::text, $3::text, $4)",
            [ownerid, name, beschreibung, bild]
        )
        console.log("Gericht created")
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// public
async function createPlaylist(name,artistid){
    try {
        const result = await pool.query(
            "INSERT INTO playlist (name, artistid) VALUES ($1::text, $2::int)",
            [name, artistid]
        )
        console.log("Playlist created")
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// public
async function createPlaylistInhalt(playlistid,liedid){
    try {
        const result = await pool.query(
            "INSERT INTO playlistinhalt (playlistid,liedid) VALUES ($1::int, $2::int)",
            [playlistid, liedid]
        )
        console.log("PlaylistInhalt created")
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// public
async function createTicket(userid,eventid){
    try {
        const result = await pool.query(
            "INSERT INTO tickets (userid,eventid) VALUES ($1::int, $2::int)",
            [userid, eventid]
        )
        console.log("Ticked created")
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// ------------------------- GET - QUERIES ------------------------- //

async function getStuffbyName(req){
    try {
        const result = await pool.query(
            "SELECT * FROM $1::text WHERE UPPER(name) LIKE UPPER($2)",
            [req.body["table"], req.body["value"]]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function getCatererByName(name){
    try {
        const result = await pool.query(
            "SELECT c.*,a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region FROM caterer c JOIN app_user a ON c.emailfk = a.email WHERE UPPER(a.benutzername) LIKE UPPER($1::text)",
            [`%${name}%`]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function getArtistByName(name){
    try {
        const result = await pool.query(
            "SELECT ar.*, a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region FROM artist ar JOIN app_user a ON ar.emailfk = a.email WHERE UPPER(a.benutzername) LIKE UPPER($1::text)",
            [`%${name}%`]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function getUserById(id){
    try {
        const result = await pool.query(
            "SELECT * FROM app_user WHERE id = $1::int",
            [id]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function getAllTicketsFromUser(userId){
    try {
        const result = await pool.query(
            "SELECT name FROM event  JOIN tickets ON tickets.eventid = event.id WHERE tickets.userid = $1::int",
            [userId]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function getUserByEmail(email){
    try {
        const result = await pool.query(
            "SELECT id, benutzername, profilname, email, profilbild, kurzbeschreibung, beschreibung, region FROM app_user WHERE email = $1::text",
            [email]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function getArtistByEvent(id){
    try {
        const result = await pool.query(
            "SELECT a.benutzername,a.profilbild FROM app_user a JOIN artist ar  ON ar.emailfk = a.email JOIN serviceartist sa ON sa.artistid = ar.id JOIN event e ON e.id = sa.eventid WHERE sa.eventid = $1::int",
            [id]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function getCatererByEvent(id){
    try {
        const result = await pool.query(
            "SELECT a.benutzername,a.profilbild FROM app_user a JOIN caterer cr  ON cr.emailfk = a.email JOIN servicecaterer sc ON sc.catererid = cr.id JOIN event e ON e.id = sc.eventid WHERE sc.eventid = $1::int",
            [id]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function getPlaylistContent(name) {
    try {
        const result = await pool.query(
            "SELECT p.name AS playlistname, l.name AS liedname FROM playlist p JOIN playlistinhalt pi ON p.id = pi.playlistid JOIN lied l ON pi.liedid = l.id WHERE UPPER(p.name) LIKE UPPER($1)",
            [`%${name}%`]
        )
        console.log(result)
        return result
    } catch (err) {
        console.log(err)
        return null
    }
}

async function searchEvent(req,res){
    let searchString = "SELECT e.* FROM event e";
    let fileterOptions="";
    let isOpenair =0;
    for(let name in req.body)
    {
        if(!req.body[name]==""){
            if(name.localeCompare("search")==0)
            {
                fileterOptions+= " UPPER(e.name) LIKE UPPER('%" + req.body[name] + "%')";
            }
            else if(name.localeCompare("openair")==0)
            {
                isOpenair = 1
                fileterOptions+= " JOIN location l ON e.locationid = l.id WHERE l.openair = "+req.body[name] ;
            }            
            else
            {
                if(Array.isArray(req.body[name]))
                {
                    if(req.body[name][0]=="")
                        {
                            req.body[name][0]=0
                            if(req.body[name][1]=="")
                            {
                                continue;
                            }
                        }
                    if(req.body[name][1]=="")
                    {
                        req.body[name][1]=0;
                    }
                    fileterOptions+= " e."+name + " BETWEEN '"+ req.body[name][0] + "' AND '" + req.body[name][1]+"'";
                }
                else
                {
                    fileterOptions+= " e."+name + " = '" + req.body[name] + "'";
                }
                
            }
            fileterOptions += " AND"
        }
    }
    fileterOptions = fileterOptions.substring(0,fileterOptions.length-3)
    if(fileterOptions!=""&&isOpenair==0)
    {
        searchString+= " WHERE" + fileterOptions;
    }
    else if(isOpenair==1)
    {
        searchString+= fileterOptions;
    }

    console.log(searchString)
    let result = await pool.query(searchString)
    const result2 = await pool.query("SELECT l.name,l.id FROM location l JOIN event e ON e.locationid = l.id")
    result.rows  = result.rows.concat(result2.rows)
    res.send(result)   
}

module.exports = {
    createEndUser, createArtist, createCaterer, createEvent, createLocation, createReviewEvent, createReviewUser, createReviewLocation, createServiceArtist, createLied, createGericht, createPlaylist, createPlaylistInhalt, createTicket, createServiceArtist,
    getUserById, getUserByEmail, searchEvent, getStuffbyName, getCatererByName , getArtistByName, getAllTicketsFromUser, getArtistByEvent, getCatererByEvent, getPlaylistContent,
    comparePassword
};

