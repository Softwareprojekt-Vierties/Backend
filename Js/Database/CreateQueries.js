const { pool } = require('./Database.js')
const bcrypt = require('bcrypt')
const DeleteQueries = require('./DeleteQueries.js')

/**
 * Creates an app_user and hashes the given password and saves it on the database.
 * @param {!string} benutzername - must not be null
 * @param {!string} profilname - must not be null
 * @param {!string} email - must not be null
 * @param {!string} password - must not be null
 * @param {string} profilbild
 * @param {string} kurzbeschreibung 
 * @param {string} beschreibung 
 * @param {string} region
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region){
    let passwordID = undefined
    try {
        // first save the password
        const salt = await bcrypt.genSalt(15)
        passwordID = await pool.query(
            `INSERT INTO password (salt, hash) VALUES ($1, $2) RETURNING id`,
            [salt, await bcrypt.hash(password, salt)]
        ).then(res => {return res.rows[0]})

        if (passwordID === undefined) throw new Error("COULDN'T SAVE PASSWORD ON THE DATABASE!")
        
        // then create the app_user
        await pool.query(
            "INSERT INTO app_user (benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region) VALUES ($1::text, $2::text, $3::text, $4::integer, $5, $6::text, $7::text, $8::text)",
            [benutzername, profilname, email, passwordID['id'], profilbild, kurzbeschreibung, beschreibung, region])
        console.log("app_user CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        // delete the password if creation of app_user failed
        if (passwordID != undefined) await DeleteQueries.deletePasswordById(passwordID)
        console.error("FAILED TO CREATE app_user",err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Creates an app_user and then the enduser on the database.
 * @param {!string} benutzername - must not be null
 * @param {!string} profilname - must not be null
 * @param {!string} email - must not be null
 * @param {!string} password - must not be null
 * @param {string} profilbild 
 * @param {string} kurzbeschreibung 
 * @param {string} beschreibung 
 * @param {string} region 
 * @param {!number} alter - must not be null
 * @param {string} arten - the types of 
 * @param {string} lied 
 * @param {string} gericht 
 * @param {string} geschlecht 
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createEndUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht){
    // create app_user first
    const app_user = await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)

    if (!app_user.success) return {
        success: false,
        error: app_user.error
    }

    // create enduser afterwards
    try {
        await pool.query(
            "INSERT INTO endnutzer (emailfk, alter, arten, lied, gericht, geschlecht) VALUES ($1::text, $2::int, $3::text, $4::text, $5::text, $6::text)",
            [email, alter, arten, lied, gericht, geschlecht]
        )
        console.log("enduser CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error("FAILED TO CREATE endnutzer",err)
        return {
            success: false,
            error: err
        }
    }
    
}

/**
 * Creates an app_user and then the artist on the database.
 * @param {!string} benutzername - must not be null
 * @param {!string} profilname - must not be null
 * @param {!string} email - must not be null
 * @param {!string} password - must not be null
 * @param {string} profilbild 
 * @param {string} kurzbeschreibung 
 * @param {string} beschreibung 
 * @param {string} region 
 * @param {!string} preis - must not be null
 * @param {string} kategorie 
 * @param {string} erfahrung 
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - id: [id of the created artist, null if creation failed]
 * - error: [the error, if one occured]
 */
async function createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    const app_user = await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)

    if (!app_user.success) return {
        success: false,
        id: null,
        error: app_user.error
    }
    
    // create artist afterwards
    try {
        const res = await pool.query(
            "INSERT INTO artist (emailfk, preis, kategorie, erfahrung) " + 
            "VALUES ($1::text, $2::text, $3::text, $4::text) RETURNING id",
            [email,preis,kategorie,erfahrung]
        )
        console.log("artist created")
        return {
            success: true,
            id: res.rows[0]['id'],
            error: null
        }
    } catch (err) {
        console.error("FAILED TO CREATE artist",err)
        return {
            success: false,
            id: null,
            error: err
        }
    }
}

/**
 * Creates an app_user and then the caterer on the database.
 * @param {!string} benutzername - must not be null
 * @param {!string} profilname - must not be null
 * @param {!string} email - must not be null
 * @param {string} password - must not be null
 * @param {string} profilbild 
 * @param {string} kurzbeschreibung 
 * @param {string} beschreibung 
 * @param {string} region 
 * @param {!string} preis - must not be null
 * @param {string} kategorie 
 * @param {string} erfahrung 
 * @returns {!Object}
 * - success: [true if successful, false otherwise]
 * - id: [id of the created artist, null if creation failed]
 * - error: [the error, if one occured]
 */
async function createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    const app_user = await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)
    
    if (app_user == false) return {
        success: false,
        id: null,
        error: app_user.error
    }

    // create caterer afterwards
    try {
        const res = await pool.query(
            "INSERT INTO caterer (emailfk, preis, kategorie, erfahrung) " + 
            "VALUES ($1::text, $2::text, $3::text, $4::text) RETURNING id",
            [email,preis,kategorie,erfahrung]
        )
        console.log("CATERER ERSTELLT", res.rows[0]['id'])
        return {
            success: true, 
            id: res.rows[0]['id'],
            error: null
        }
    } catch (err) {
        console.error("FAILED TO CREATE caterer",err)
        return {
            success: false,
            id: null,
            error: err
        }
    }
}

/**
 * Creates a location on the database.
 * @param {!string} adresse - must not be null
 * @param {!string} name - must not be null
 * @param {string} beschreibung 
 * @param {number} ownerID 
 * @param {!boolean} privat - must not be null
 * @param {string} kurzbeschreibung 
 * @param {!string} preis - must not be null
 * @param {!string} kapazitaet - must not be null
 * @param {!boolean} openair - must not be null
 * @param {!string} flaeche - must not be null
 * @param {string} bild 
 * @returns {!Object}
 * - success: [true if successful, false otherwise]
 * - id: [id of the created location, null if creation failed]
 * - error: [the error, if one occured]
 */
async function createLocation(adresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild){
    try {   
        const location = await pool.query(
            "INSERT INTO location (adresse, name, beschreibung, ownerid, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild) " + 
            "VALUES ($1::text, $2::text, $3::text, $4::int, $5::bool, $6::text, $7::text, $8::int, $9::bool, $10::text, $11) RETURNING id",
            [adresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild]
        )
        console.log("location CREATED")
        return {
            success: true,
            id: location.rows[0],
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE location",err)
        return {
            success: false,
            id: null,
            error: err
        }
    }
}

/**
 * Creates a review on the database
 * @param {!string} inhalt - the content of the review
 * @param {!number} sterne - a rating between 1-5
 * @param {!number} ownerid - the id of the app_user
 * @param {!number} id - if of what is being reviewed
 * @param {!string} intention - must be one of the following:
 * 
 * - 'event'
 * - 'location'
 * - 'user'
 * @returns {!Object}
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createReview(inhalt, sterne, ownerid, id, intention) {
    try {
        let query

        if (intention.matchAll('event')) {
            query = "INSERT INTO review (inhalt, sterne, ownerid, eventid) VALUES ($1::text,$2::int,$3::int,$4::int)"
        } else if (intention.matchAll('location')) {
            query = "INSERT INTO review (inhalt, sterne, ownerid, locationid) VALUES ($1::text,$2::int,$3::int,$4::int)"
        } else if (intention.matchAll('user')) {
            query = "INSERT INTO review (inhalt, sterne, ownerid, userid) VALUES ($1::text,$2::int,$3::int,$4::int)"
        } else {
            throw new Error("UNKNOWN intention FOR review")
        }

        await pool.query(
            query, 
            [inhalt,sterne,ownerid,id]
        )
        console.log("review CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error("FAILED TO CREATE review",err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Creates an event on the database.
 * @param {!string} name - name of the event
 * @param {!string} datum - when does the event start
 * @param {!string} uhrzeit - at what time does it start
 * @param {!number} eventgroesse - how many people can come
 * @param {!string} preis - the price
 * @param {!number} altersfreigabe - age restriction
 * @param {!boolean} privat - private or public
 * @param {string} kurzbeschreibung - short description
 * @param {string} beschreibung - description
 * @param {string} bild - event picture
 * @param {!number} ownerid - id of app_user who hosts the event
 * @param {!number} locationid - id of location where it is hosted
 * @returns {!Object}
 * - success: [true if successful, false otherwise]
 * - id: [id of the created event, null if creation failed]
 * - error: [the error, if one occured]
 */
async function createEvent(name, datum, uhrzeit, eventgroesse, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid){
    try {
        const event = await pool.query(
            "INSERT INTO event (name, datum, uhrzeit, eventgroesse, freietickets, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid) " + 
            "VALUES ($1::text, $2, $3::int, $4::int, $5::int, $6::int, $7::int, $8::bool, $9::text, $10::text, $11, $12::int, $13::int) RETURNING id",
            [name,datum,uhrzeit,eventgroesse,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,bild,ownerid,locationid]
        )
        console.log("event CREATED")
        return {
            success: true,
            id: event.rows[0],
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE AN event",err)
        return {
            success: false,
            id: null,
            error: err
        }
    }
}

/**
 * Creates a serviceartist on the database.
 * @param {!number} eventid 
 * @param {!number} artistid 
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createServiceArtist(eventid, artistid){
    try {
        await pool.query(
            "INSERT INTO serviceartist (eventid, artistid) VALUES ($1::int,$2::int)",
            [eventid,artistid]
        )
        console.log("serviceartist CREATED")
        return {
            success: true,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE serviceartist",err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Creates a servicecaterer on the database.
 * @param {!number} eventid 
 * @param {!number} catererid 
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createServiceCaterer(eventid, catererid){
    try {
        await pool.query(
            "INSERT INTO servicecaterer (eventid, catererid) VALUES ($1::int,$2::int)",
            [eventid,catererid]
        )
        console.log("servicecaterer CREATED")
        return {
            success: true,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE servicecaterer",err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Creates a lied on the database.
 * @param {!number} ownerid - the id of the artist
 * @param {!string} name - name of the lied
 * @param {!number} laenge - length in minutes
 * @param {!string} erscheinung - date in YYYY-MM-DD
 * @returns {!Object}
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createLied(ownerid,name,laenge,erscheinung){
    try {
        await pool.query(
            "INSERT INTO lied (ownerid, name, laenge, erscheinung) VALUES ($1::int, $2::text, $3::numeric, $4::date)",
            [ownerid,name,laenge,erscheinung]
        )
        console.log("lied CREATED")
        return {
            success: true,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE lied",err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Creates a gericht on the database.
 * @param {!number} ownerid - id of the caterer
 * @param {!string} name 
 * @param {!string} beschreibung 
 * @param {string} bild 
 * @returns {!Object}
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createGericht(ownerid,name,beschreibung,bild=null){
    try {
        await pool.query(
            "INSERT INTO gericht (ownerid,name,beschreibung,bild) VALUES ($1, $2::text, $3::text, $4)",
            [ownerid, name, beschreibung, bild]
        )
        console.log("gericht CREATED")
        return {
            success: true,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE gericht",err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Creates a playlist on the database.
 * @param {!string} name 
 * @param {!number} artistid
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createPlaylist(name,artistid){
    try {
        await pool.query(
            "INSERT INTO playlist (name, artistid) VALUES ($1::text, $2::int)",
            [name, artistid]
        )
        console.log("playlist CREATED")
        return {
            success: true,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE playlist",err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Creates a playlistinhalt on the database.
 * @param {!number} playlistid
 * @param {!number} liedid 
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createPlaylistInhalt(playlistid,liedid){
    try {
        await pool.query(
            "INSERT INTO playlistinhalt (playlistid,liedid) VALUES ($1::int, $2::int)",
            [playlistid, liedid]
        )
        console.log("playlistinhalt CREATED")
        return {
            success: true,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE playlistinhalt",err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Creates a ticket on the database.
 * @param {!number} userid 
 * @param {!number} eventid 
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createTicket(userid,eventid){
    try {
        await pool.query(
            "INSERT INTO tickets (userid,eventid) VALUES ($1::int, $2::int)",
            [userid, eventid]
        )
        console.log("ticked CREATED")
        return {
            success: true,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE playlistinhalt",err)
        return {
            success: false,
            error: err
        }
    }
}

module.exports = {
    createEndUser, 
    createArtist, 
    createCaterer, 
    createEvent, 
    createLocation, 
    createReview,
    createServiceArtist,
    createServiceCaterer, 
    createLied, 
    createGericht, 
    createPlaylist, 
    createPlaylistInhalt, 
    createTicket
}