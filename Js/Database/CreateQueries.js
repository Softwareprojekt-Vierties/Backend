const { pool } = require('./Database.js')
const bcrypt = require('bcrypt');

// private
async function createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region){
    let passwordID = undefined
    try {
        // first save the password
        const salt = await bcrypt.genSalt(15)
        passwordID = await pool.query(
            `INSERT INTO password (salt, hash) VALUES ($1, $2) RETURNING id`,
            [salt, await bcrypt.hash(password, salt)]
        ).then(res => {return res.rows[0]})

        console.log("PasswordID",passwordID)

        if (passwordID === undefined) throw new Error("Password konnte nicht auf der Datenbank gespeichert werden!")
        
        // then create the app_user
        const result = await pool.query(
            "INSERT INTO app_user (benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region) VALUES ($1::text, $2::text, $3::text, $4::integer, $5, $6::text, $7::text, $8::text)",
            [benutzername, profilname, email, passwordID['id'], profilbild, kurzbeschreibung, beschreibung, region])
        console.log("app_user created")
        return true;
    } catch (err) {
        // delete the password if creation of app_user failed
        if (passwordID != undefined) {
            await pool.query(
                "DELETE FROM password WHERE id = $1::integer",
                [passwordID['id']]
            ).catch(err => {
                console.error("Failed to remove password:",err)
            })
        }
        console.error(err)
        return false
    }
}

// public
async function createEndUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht){
    // create app_user first
    const app_user = await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)

    if (app_user == false) return false

    // create enduser afterwards
    try {
        const res = await pool.query(
            "INSERT INTO endnutzer (emailfk, alter, arten, lied, gericht, geschlecht) VALUES ($1::text, $2::int, $3::text, $4::text, $5::text, $6::text)",
            [email, alter, arten, lied, gericht, geschlecht]
        )
        console.log("enduser created")
        return true
    } catch (err) {
        console.error(err)
        return false
    }
    
}

// public
async function createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    const app_user = await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)
    // create artist afterwards

    if (app_user == false) return {
        success: false,
        error: "app_user CREATION FAILED"
    }

    try {
        const res = await pool.query(
            "INSERT INTO artist (emailfk, preis, kategorie, erfahrung) " + 
            "VALUES ($1::text, $2::text, $3::text, $4::text) RETURNING id",
            [email,preis,kategorie,erfahrung]
        )
        console.log("artist created")
        return {
            success: true,
            id: res.rows[0]['id']
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

// public
async function createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    const app_user = await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)
    
    if (app_user == false) return {
        success: false,
        error: "app_user CREATION FAILED"
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
            id: res.rows[0]['id']
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

// public
async function createLocation(adresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild){
    try {   
        const res = await pool.query(
            "INSERT INTO location (adresse, name, beschreibung, ownerid, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild) " + 
            "VALUES ($1::text, $2::text, $3::text, $4::int, $5::bool, $6::text, $7::text, $8::int, $9::bool, $10::text, $11)",
            [adresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bild]
        )
        console.log("location Created")
        return true
    } catch(err) {
        console.error(err)
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
        console.error(err)
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
        console.error(err)
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
        console.error(err)
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
        console.error(err)
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
        console.error(err)
        return false
    }
}

// public
async function createLied(ownerid,name,laenge,erscheinung){
    try {
        const res = await pool.query(
            "INSERT INTO lied (ownerid, name, laenge, erscheinung) VALUES ($1::int, $2::text, $3::numeric, $4::date)",
            [ownerid,name,laenge,erscheinung]
        )
        console.log("Lied created")
        return true
    } catch(err) {
        console.error(err)
        return false
    }
}

// public
async function createGericht(ownerid,name,beschreibung,bild=null){
    try {
        const result = await pool.query(
            "INSERT INTO gericht (ownerid,name,beschreibung,bild) VALUES ($1, $2::text, $3::text, $4)",
            [ownerid, name, beschreibung, bild]
        )
        console.log("Gericht created")
        return true
    } catch (err) {
        console.error(err)
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
        console.error(err)
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
        console.error(err)
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
        console.error(err)
        return false
    }
}

module.exports = {
    createEndUser, 
    createArtist, 
    createCaterer, 
    createEvent, 
    createLocation, 
    createReviewEvent, 
    createReviewUser, 
    createReviewLocation, 
    createServiceArtist, 
    createLied, 
    createGericht, 
    createPlaylist, 
    createPlaylistInhalt, 
    createTicket, 
    createServiceArtist
}