const { response } = require('express');
const {Pool} = require('pg');
const cookieJwtAuth = require('./CookieJwtAuth')
const bcrypt = require('bcrypt');


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
        const SH = await pool.query(
            "SELECT p.salt, p.hash FROM app_user a JOIN password p ON a.password = p.id WHERE email = $1::text",
            [email]
        )

        const isMatch = await bcrypt.compare(password, SH.rows[0]['hash'])

        if (isMatch) {
            console.log('User authenticated!')
            const user = await pool.query(
                "SELECT * FROM app_user WHERE email = $1::text",
                [email]
            )
            return user.rows[0]
        }
        console.error('Authentication failed.')
        return null
    } catch (err) {
        console.error(err)
        return null
    }
}

// ------------------------- CREATE - QUERIES ------------------------- //
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

// ------------------------- UPDATE - QUERIES ------------------------- //
async function updateApp_user(profilname, profilbild, kurzbeschreibung, beschreibung, region, email) {
    try {
        const result = await pool.query(
            `UPDATE app_user SET
            profilname = $1::text,
            profilbild = $2::text,
            kurzbeschreibung = $3::text,
            beschreibung = $4::text,
            region = $5::text
            WHERE email = $6::text`,
            [profilname, profilbild, kurzbeschreibung, beschreibung, region, email]
        )
        console.log(`app_user UPDATED`)
        return true
    } catch (err) {
        console.error(`COULDN'T UPDATE app_user`,err)
        return false
    }
}

async function updateEndnutzer(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, alter, arten, lied, gericht, geschlecht) {
    if (!updateApp_user(profilname, profilbild, kurzbeschreibung, beschreibung, region, email)) { // if failed
        console.error(`CANNOT UPDATE endnutzer BECAUSE UPDATE app_user FAILED`)
        return false
    }

    try {
        const result = await pool.query(
            `UPDATE endnutzer SET
            alter = $1::int,
            arten = $2::text,
            lied = $3::text,
            gericht = $4::text,
            geschlecht = $5::text
            WHERE emailfk = $6::text`,
            [alter, arten, lied, gericht, geschlecht, email]
        )
        console.log(`endnutzer UPDATED`)
        return true
    } catch (err) {
        console.error(`COULDN'T UPDATE endnutzer`,err)
        return false
    }
}

async function updateArtist(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung) {
    if (false == await updateApp_user(profilname, profilbild, kurzbeschreibung, beschreibung, region, email)) { // if failed
        console.error(`CANNOT UPDATE artist BECAUSE UPDATE app_user FAILED`)
        return false
    }

    try {
        const result = await pool.query(
            `UPDATE artist SET
            preis = $1::text,
            kategorie = $2::text,
            erfahrung = $3::text
            WHERE emailfk = $4::text`,
            [preis, kategorie, erfahrung, email]
        )
        console.log(`artist UPDATED`)
        return {
            success: true
        }
    } catch (err) {
        console.error(`COULDN'T UPDATE artist`,err)
        return {
            success: false,
            error: err
        }
    }
}

async function updateCaterer(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung) {
    if (false == await updateApp_user(profilname, profilbild, kurzbeschreibung, beschreibung, region, email)) { // if failed
        console.error(`CANNOT UPDATE caterer BECAUSE UPDATE app_user FAILED`)
        return {
            success: false,
            error: "UPDATE app_user FAILED"
        }
    }

    try {
        const result = await pool.query(
            `UPDATE caterer SET
            preis = $1::text,
            kategorie = $2::text,
            erfahrung = $3::text
            WHERE emailfk = $4::text`,
            [preis, kategorie, erfahrung, email]
        )
        console.log(`caterer UPDATED`)
        return {
            success: true
        }
    } catch (err) {
        console.error(`COULDN'T UPDATE caterer`,err)
        return {
            success: false,
            error: err
        }
    }
}

async function updateEvent() {
    console.error("UPDATE EVENT NOT YET IMPLEMENTED")
    return false
}

async function updateGericht(id, name, beschreibung, bild) {
    try {
        const result = await pool.query(
            `UPDATE gericht SET
            name = $1::text,
            beschreibung = $2::text,
            bild = $3::text
            WHERE id = $4::int`,
            [name, beschreibung, bild, id]
        )
        console.error("gericht UPDATED")
        return true
    } catch (err) {
        console.error("FAILED TO UPDATE gericht", err)
        return false
    }
}

async function updateLied(id, name, laenge, erscheinung) {
    try {
        const result = await pool.query(
            `UPDATE lied SET
            name = $1::text,
            laenge = $2::numeric,
            erscheinung = $3::date
            WHERE id = $4::int`,
            [name, laenge, erscheinung, id]
        )
        console.error("lied UPDATED")
        return true
    } catch (err) {
        console.error("FAILED TO UPDATE lied", err)
        return false
    }
}

async function updateLocation(locationid, adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet) {
    try {
        const result = await pool.query(
            `UPDATE location SET
            adresse = $1::text,
            name = $2::text,
            beschreibung = $3::text,
            privat = $4::boolean,
            kurzbeschreibung = $5::text,
            preis = $6::text,
            openair = $7::boolean,
            flaeche = $8::text,
            bild = $9::text,
            kapazitaet = $10::int
            WHERE id = $11::int`,
            [adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet, locationid]
        )
        console.log(`location UPDATED`)
        return true
    } catch (err) {
        console.error(`COULDN'T UPDATE location`,err)
        return false
    }
}

async function updatePassword(token, oldPassword, newPassword) {
    try {
        const cookie = cookieJwtAuth.getUser(token)

        // create new hashed Password
        const salt = await bcrypt.genSalt(15)
        const newHash = await bcrypt.hash(newPassword, salt)

        // compare given old password to the one stored on DB
        const oldHash = await pool.query(
            `SELECT hash FROM password WHERE id = $1::int`,
            [cookie.rows[0]['password']]
        )
        const isMatch = await bcrypt.compare(oldPassword, oldHash.rows[0]['hash'])
        // check
        if (!isMatch) throw new Error("OLD PASSWORD DOES NOT MATCH WITH THE ONE SAVED ON THE DB")

        // if check passed, update password
        const result = await pool.query(
            `UPDATE password SET
            salt = $1::text,
            hash = $2::text
            WHERE id = $3::int`,
            [salt, newHash, cookie.rows[0]['password']]
        )
        console.log(`password UPDATED`)
        return true
    } catch (err) {
        console.error(`COULDN'T UPDATE password`,err)
        return false
    }
}

async function updatePlaylist() {
    console.error("UPDATE PLAYLIST NOT YET IMPLEMENTED")
    return false
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
        console.error(err)
        return null
    }
}

async function getLocationById(req,res){
    try {
        const result = await pool.query(
            "SELECT * FROM location WHERE id = $1::int",
            [req.params["id"]]
        )
        console.log(req.params["id"])
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send(null)
    }
}

async function getCatererById(req,res){
    const id = req.params["id"]
    try {
        
        const cater = await pool.query(
            "SELECT c.*,a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region FROM caterer c JOIN app_user a ON c.emailfk = a.email WHERE c.id = $1",
            [id]
        )
        console.log(cater)

        const gericht = await pool.query(
            `SELECT g.id, g.name, g.beschreibung, g.bild
            FROM gericht g
            WHERE g.ownerid = $1::int`,
            [id]
        )
        console.log(gericht)

        return res.status(200).send({
            caterer: cater,
            gerichte: gericht
        })
    } catch (err) {
        console.error(err)
        return res.status(400).send(err)
    }
}

async function getArtistByID(req,res){
    const id = req.params["id"]
    try {
        const art = await pool.query(
            "SELECT ar.*, a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region FROM artist ar JOIN app_user a ON ar.emailfk = a.email WHERE ar.id = $1",
            [id]
        )
        console.log(art)

        const lied = await pool.query(
            `SELECT l.id, l.name, l.laenge, l.erscheinung
            FROM lied l
            WHERE l.ownerid = $1::int`,
            [id]
        )
        console.log(lied)

        return res.status(200).send({
            artist: art,
            lieder: lied
        })
    } catch (err) {
        console.error(err)
        return res.status(400).send(err)
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
        console.error(err)
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
        console.error(err)
        return null
    }
}

async function getUserByEmailandUsername(email,benutzername){
    try {
        const result = await pool.query(
            "SELECT * FROM app_user WHERE email = $1::text AND benutzername = $2::text",
            [email, benutzername]
        )
        console.log(result)
        return result
    } catch (err) {
        console.error(err)
        return null
    }
}

// async function getUserByEmail(email,pass){
//     try {
//         const result = await pool.query(
//             "SELECT * FROM app_user WHERE email = $1::text AND password = $2::text",
//             [email, pass]
//         )
//         console.log(result)
//         return result
//     } catch (err) {
//         console.error(err)
//         return null
//     }
// }

async function getArtistByEvent(id){
    try {
        const result = await pool.query(
            "SELECT a.benutzername,a.profilbild FROM app_user a JOIN artist ar  ON ar.emailfk = a.email JOIN serviceartist sa ON sa.artistid = ar.id JOIN event e ON e.id = sa.eventid WHERE sa.eventid = $1::int",
            [id]
        )
        console.log(result)
        return result
    } catch (err) {
        console.error(err)
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
        console.error(err)
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
        console.error(err)
        return null
    }
}

async function searchEvent(req,res){
    console.log("REQUEST",req.body)
    // const user = cookieJwtAuth.getUser(req.headers["auth"])
    const user = 45
    let query = "SELECT e.*, l.name AS locationname,l.adresse as adresse, fe.userid as favorit FROM event e JOIN location l ON e.locationid = l.id"
    let additionalFilter = ""
    let param = []
    let istfavorit = " LEFT OUTER JOIN favorit_event fe ON e.id = fe.eventid"
    let ticktjoin = ""
    let paramIndex = 0;
    let doAND
    for (let key in req.body) {
        doAND = true
        switch (key) {
            case 'openair':
                additionalFilter += "l.openair = true"
                break
            case 'search':
                paramIndex++
                additionalFilter += "UPPER(e.name) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'datum':
                paramIndex++
                additionalFilter += "e.datum = $"+paramIndex+"::date"
                param.push(req.body[key])
                break
            case 'uhrzeit':
                paramIndex++
                additionalFilter += "e.uhrzeit BETWEEN $"+paramIndex+" AND "
                param.push((req.body[key])[0] == '' ? "00:00" : (req.body[key])[0])
                paramIndex++
                additionalFilter += "$"+paramIndex+""
                param.push((req.body[key])[1] == '' ? "23:59" : (req.body[key])[1])
                break
            case 'eventgroesse':
                paramIndex++
                additionalFilter += "e.eventgroesse >= $"+paramIndex+"::int"
                param.push(req.body[key])
                break
            case 'altersfreigabe':
                paramIndex++
                additionalFilter += "e.altersfreigabe >= $"+paramIndex+"::int"
                param.push(req.body[key])
                break
            case 'region':
                paramIndex++
                additionalFilter += "UPPER(l.adresse) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'distanz':
                console.error("DISTANZ NOT YET IMPLEMENTED")
                doAND = false
                break
            case 'istbesitzer':
                paramIndex++
                additionalFilter += "e.ownerid >= $"+paramIndex+"::int"
                param.push(user)
                break
            case 'dauer':
                paramIndex+=2
                additionalFilter += "e.dauer BETWEEN $"+(paramIndex-1)+"::int AND $"+paramIndex+"::int"
                param.push((req.body[key])[0] == '' ? "0" : (req.body[key])[0],
                            (req.body[key])[1] == '' ? "1000" : (req.body[key])[1])
                break
            case 'hatticket':
                paramIndex++
                ticktjoin +=" JOIN tickets t ON e.id = t.eventid" 
                additionalFilter += "t.userid = $"+paramIndex+"::int"
                param.push(user)
                break
            case 'istfavorit':
                paramIndex++
                additionalFilter+="fe.userid = $"+paramIndex+"::int"
                param.push(user) 
                break
            case 'preis':
                paramIndex+=2
                additionalFilter += "e.preis BETWEEN $"+(paramIndex-1)+"::text AND $"+paramIndex+"::text"
                param.push((req.body[key])[0] == '' ? "0" : (req.body[key])[0],
                        (req.body[key])[1] == '' ? "999999" : (req.body[key])[1])
                break
            default:
                // do nothing
                doAND = false
                break
        }
        if (doAND) additionalFilter += " AND "
    }

    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '
    paramIndex == 0 ? sqlstring = query + istfavorit : sqlstring = query + istfavorit + ticktjoin + " WHERE " + additionalFilter

    try {
        const result = await pool.query(sqlstring,param)
        for (let i=0;i<result.rowCount;i++)
        {
            //checks if the Event is a users Favorit
            if(Object.hasOwn(result.rows[i],"favorit")) {result.rows[i]["favorit"] == user ? result.rows[i]["favorit"] = true : result.rows[i]["favorit"] = false}
        }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an Event")
    }
}

async function searchLocaiton(req,res){
    console.log("REQUEST",req.body)
    // const user = cookieJwtAuth.getUser(req.headers["auth"])
    const user = 45
    let query = "SELECT location.*, favorit_location.userid as favorit FROM location"
    let additionalFilter = ""
    let istfavorit = " LEFT OUTER JOIN favorit_location ON location.id = favorit_location.locationid"
    let param = []
    let sqlstring=""

    let paramIndex = 0;
    let doAND
    
    for (let key in req.body) {
        doAND = true
        switch (key) {
            case 'openair':
                paramIndex++
                additionalFilter += "openair = $"+paramIndex+"::boolean"
                param.push(req.body[key])
                break
            case 'search':
                paramIndex++
                additionalFilter += "UPPER(name) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'region':
                paramIndex++
                additionalFilter += "UPPER(adresse) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'preis':
                paramIndex++
                additionalFilter += "preis >= $"+paramIndex+"::text"
                param.push(req.body[key])
                break
            case 'kapazitaet':
                paramIndex+=2
                additionalFilter += "kapazitaet BETWEEN $"+(paramIndex-1)+"::int AND $"+paramIndex+"::int"
                param.push(req.body[key][0],req.body[key][1])
                break
            case 'distanz':
                console.error("DISTANZ NOT YET IMPLEMENTED")
                doAND = false
                break
            case 'istfavorit':
                paramIndex++
                additionalFilter+="favorit_location.userid = $"+paramIndex+"::int"
                param.push(user) 
                break
            case 'istbesitzer':
                paramIndex++
                additionalFilter += "ownerid = $"+paramIndex+"::int"
                param.push(user)   
                break
            case 'bewertung':
                paramIndex++
                additionalFilter+="sterne >= $"+paramIndex+"::int"
                param.push(req.body[key])   
                break
            default:
                // do nothing
                doAND = false
                break
        }
        if (doAND) additionalFilter += " AND "
    }

    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '

    paramIndex == 0 ? sqlstring = query + istfavorit : sqlstring = query + istfavorit + " WHERE " + additionalFilter
   
    try {
        const result = await pool.query(sqlstring,param)
        for (let i=0;i<result.rowCount;i++)
        {
            //checks if the locataion is a user Favorit
            if(Object.hasOwn(result.rows[i],"favorit")) {result.rows[i]["favorit"] == user ? result.rows[i]["favorit"] = true : result.rows[i]["favorit"] = false}
        }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an location")
    }
   

    // with additional params
    // try {
        
    //     const result = await pool.query(
    //         query += istfavorit += " WHERE " + additionalFilter,
    //         param
    //     )
    //     return res.send(result)
    // } catch (err) {
    //     console.error(err)
    //     return res.status(400).send("Error while searching for an event")
    // }
}


async function searchCaterer(req,res){
    console.log("REQUEST",req.body)
    // const user = cookieJwtAuth.getUser(req.headers["auth"])
    const user = 45
    let query = "SELECT c.preis,c.kategorie,c.erfahrung,a.profilname as name,a.region,a.profilbild,a.kurzbeschreibung,a.sterne, fu.userid AS favorit FROM caterer c JOIN app_user a ON c.emailfk = a.email"
    let additionalFilter = ""
    let param = []
    let istfavorit = " LEFT OUTER JOIN favorit_user fu ON c.id = fu.catereid"
    let paramIndex = 0;
    let doAND
    for (let key in req.body) {
        doAND = true
        switch (key) {
            case 'openair':
                //probelm
                additionalFilter += "openair = $"+paramIndex+"::boolean"
                param.push(req.body[key])
                break
            case 'profilname':
                paramIndex++
                additionalFilter += "UPPER(a.profilname) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'region':
                paramIndex++
                additionalFilter += "UPPER(a.region) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'preis':
                paramIndex++
                additionalFilter += "c.preis BETWEEN $"+(paramIndex-1)+"::text AND $"+paramIndex+"::text"
                param.push((req.body[key])[0] == '' ? "0" : (req.body[key])[0],
                        (req.body[key])[1] == '' ? "9999999" : (req.body[key])[1])
                break
            case 'erfahrung':
                paramIndex++
                additionalFilter += "c.erfahrung >= $"+paramIndex+"::text"
                param.push(req.body[key])
                break
            case 'kategorie':
                paramIndex++
                additionalFilter += "UPPER(c.kategorie) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'istfavorit':
                paramIndex++
                additionalFilter+="fu.userid = $"+paramIndex+"::int"
                param.push(user) 
                break
            default:
                // do nothing
                doAND = false
                break
        }
        if (doAND) additionalFilter += " AND "
    }

    
    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '
    paramIndex == 0 ? sqlstring = query + istfavorit : sqlstring = query + istfavorit + " WHERE " + additionalFilter

    try {
        const result = await pool.query(sqlstring,param)
        for (let i=0;i<result.rowCount;i++)
        {
            //checks if the Catere is a users Favorit
            if(Object.hasOwn(result.rows[i],"favorit")) {result.rows[i]["favorit"] == user ? result.rows[i]["favorit"] = true : result.rows[i]["favorit"] = false}
        }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an Caterer")
    }

    // // with additional params
    // try {
    //     const result = await pool.query(
    //         query += " WHERE " + additionalFilter,
    //         param
            
    //     )
    //     return res.send(result)
    // } catch (err) {
    //     console.error(err)
    //     return res.status(400).send("Error while searching for an event")
    // }
}

async function searchArtist(req,res){
    console.log("REQUEST",req.body)
    // const user = cookieJwtAuth.getUser(req.headers["auth"])
    const user = 45
    let query = "SELECT a.preis,a.kategorie,a.erfahrung,ap.region,ap.profilname as name,ap.sterne,ap.profilbild,ap.kurzbeschreibung,fu.userid AS favorit FROM artist a JOIN app_user ap ON a.emailfk = ap.email"
    let additionalFilter = ""
    let istfavorit = " LEFT OUTER JOIN favorit_user fu ON a.id = fu.artistid"
    let param = []
    let paramIndex = 0;
    let sqlStirng=""
    let doAND = true

    for (let key in req.body) {
        doAND = true
        switch (key) {
            case 'profilname':
                paramIndex++
                additionalFilter += "UPPER(ap.profilname) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'region':
                paramIndex++
                additionalFilter += "UPPER(ap.region) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'preis':
                paramIndex+=2
                additionalFilter += "a.preis BETWEEN $"+(paramIndex-1)+"::text AND $"+paramIndex+"::text"
                param.push((req.body[key])[0] == '' ? "0" : (req.body[key])[0],
                        (req.body[key])[1] == '' ? "9999999" : (req.body[key])[1])
                break
            case 'erfahrung':
                paramIndex++
                additionalFilter += "a.erfahrung >= $"+paramIndex+"::text"
                param.push(req.body[key])
                break
            case 'kategorie':
                paramIndex++
                additionalFilter += "UPPER(a.kategorie) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'bewertung':
                paramIndex++
                additionalFilter += "a.sterne >= $"+paramIndex+"::int"
                param.push(req.body[key])
                break
            case 'istfavorit':
                paramIndex++
                additionalFilter+="fu.userid = $"+paramIndex+"::int"
                param.push(user) 
                break
            default:
                // do nothing
                doAND = false
                break
        }
        if (doAND) additionalFilter += " AND "
    }

    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '
    paramIndex == 0 ? sqlstring = query + istfavorit : sqlstring = query + istfavorit + " WHERE " + additionalFilter

    try {
        const result = await pool.query(sqlstring,param)
        for (let i=0;i<result.rowCount;i++)
        {
            //checks if the Artist is a users Favorit
            if(Object.hasOwn(result.rows[i],"favorit")) {result.rows[i]["favorit"] == user ? result.rows[i]["favorit"] = true : result.rows[i]["favorit"] = false}
        }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an Artist")
    }

    // // with additional params
    // try {
    //     const result = await pool.query(
    //         query += " WHERE " + additionalFilter,
    //         param
    //     )
    //     return res.send(result)
    // } catch (err) {
    //     console.error(err)
    //     return res.status(400).send("Error while searching for an event")
    // }
}

async function searchEndUser(req,res){
    console.log("REQUEST",req.body)
    // const user = cookieJwtAuth.getUser(req.headers["auth"])
    const user = 45
    let query = "SELECT e.*,ap.region,fu.userid AS favorit FROM endnutzer e JOIN app_user ap ON e.emailfk = ap.email"
    let additionalFilter = ""
    let istfavorit = " LEFT OUTER JOIN favorit_user fu ON a.id = fu.artistid"
    let param = []
    let paramIndex = 0;
    let sqlStirng=""
    let doAND = true

    for (let key in req.body) {
        doAND = true
        switch (key) {
            case 'search':
                paramIndex++
                additionalFilter += "UPPER(ap.profilname) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'region':
                paramIndex++
                additionalFilter += "UPPER(ap.region) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'geschelcht':
                paramIndex++
                additionalFilter += "UPPER(e.geschlecht) LIKE UPPER ($"+paramIndex+")"
                param.push(`%${req.body[key]}%`)
                break
            case 'alter':
                paramIndex++
                additionalFilter += "e.alter >= $"+paramIndex+"::int"
                param.push(req.body[key])
                brea
            case 'istfavorit':
                paramIndex++
                additionalFilter+="fu.userid = $"+paramIndex+"::int"
                param.push(user) 
                break
            case 'istfreund':
               // to be implementet
               doAND = false
               break
            default:
                // do nothing
                doAND = false
                break
        }
        if (doAND) additionalFilter += " AND "
    }

    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '
    paramIndex == 0 ? sqlstring = query + istfavorit : sqlstring = query + istfavorit + " WHERE " + additionalFilter

    try {
        const result = await pool.query(sqlstring,param)
        for (let i=0;i<result.rowCount;i++)
        {
            //checks if the Enduser is a users Favorit
            if(Object.hasOwn(result.rows[i],"favorit")) {result.rows[i]["favorit"] == user ? result.rows[i]["favorit"] = true : result.rows[i]["favorit"] = false}
        }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an enduser")
    }

    // // with additional params
    // try {
    //     const result = await pool.query(
    //         query += " WHERE " + additionalFilter,
    //         param
    //     )
    //     return res.send(result)
    // } catch (err) {
    //     console.error(err)
    //     return res.status(400).send("Error while searching for an event")
    // }
}

// ------------------------- DELETE - QUERIES ------------------------- //

/**
* Deletes tickets from the DB using the id from the owner of the ticket.
*
* @param {number} userid - the id of the owner of the ticket from app_user table
* @returns {Object} A JSON containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteTicketsByUserId(userid) {
    try {
        console.warn("TRYING TO DELETE tickets OF", userid)
        const result = await pool.query(
            `DELETE FROM tickets
            WHERE userid = $1::int
            RETURNING *`,
            [userid]
        )
        if (result.rows.length === 0) { // if nothing was found to be deleted
            return {
                success: true,
                data: null
            }
        }
        else {
            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A ticket", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes tickets from the DB using the id from the event of the ticket.
*
* @param {number} eventid - the id of the event of the ticket from event table
* @returns {Object} A JSON containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteTicketsByEventId(eventid) {
    try {
        console.warn("TRYING TO DELETE tickets OF", eventid)
        const result = await pool.query(
            `DELETE FROM tickets
            WHERE eventid = $1::int
            RETURNING *`,
            [eventid]
        )
        if (result.rows.length === 0) { // if nothing was found to be deleted
            return {
                success: true,
                data: null
            }
        }
        else {
            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A ticket", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes servicecaterer from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'catererid' - deletes a serviceartist based on that the id is from a caterer
* - 'eventid' - deletes a serviceartist based on that the id is from an event
* - anything else will results in a fail
* @returns {Object} A JSON containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteServiceCatererById(catererid, deleteBy) {
    try {
        console.warn("TRYING TO DELETE servicecaterer OF", catererid, deleteBy)
        let query

        if (deleteBy.matchAll('catererid')) {
            query = `DELETE FROM servicecaterer WHERE artistid = $1::int RETURNING *`
        } else if (deleteBy.matchAll('eventid')) {
            query = `DELETE FROM servicecaterer WHERE eventid = $1::int RETURNING *`
        } else {
            return {
                sucess: false,
                error: new Error("INVALID deleteBy: " + deleteBy)
            }
        }

        const result = await pool.query(query, [id])
        if (result.rows.length === 0) { // if nothing was found to be deleted
            return {
                success: true,
                data: null
            }
        }
        else {
            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE servicecaterer", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes serviceartist from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'artistid' - deletes a serviceartist based on that the id is from an artist
* - 'eventid' - deletes a serviceartist based on that the id is from an event
* - anything else will results in a fail
* @returns {Object} A JSON containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteServiceArtistById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE serviceartist OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('artistid')) {
            query = `DELETE FROM serviceartist WHERE artistid = $1::int RETURNING *`
        } else if (deleteBy.matchAll('eventid')) {
            query = `DELETE FROM serviceartist WHERE eventid = $1::int RETURNING *`
        } else {
            return {
                sucess: false,
                error: new Error("INVALID deleteBy: " + deleteBy)
            }
        }

        const result = await pool.query(query, [id])
        if (result.rows.length === 0) { // if nothing was found to be deleted
            return {
                success: true,
                data: null
            }
        }
        else {
            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE serviceartist", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes a review from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'ownerid' - deletes a review based on that the id is from the owner
* - 'eventid' - deletes a review based on that the id is from an event
* - 'userid' - deletes a review based on that the id is from a user
* - 'locationid' - deletes a review based on that the id is from a location
* - anything else will results in a fail
*
* @returns {Object} A JSON containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteReviewById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE A review OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('ownerid')) {
            query = `DELETE FROM review WHERE ownerid = $1::int RETURNING *`
        } else if (deleteBy.matchAll('eventid')) {
            query = `DELETE FROM review WHERE eventid = $1::int RETURNING *`
        } else if (deleteBy.matchAll('userid')) {
            query = `DELETE FROM review WHERE userid = $1::int RETURNING *`
        } else if (deleteBy.matchAll('locationid')) {
            query = `DELETE FROM review WHERE locationid = $1::int RETURNING *`
        } else {
            return {
                sucess: false,
                error: new Error("INVALID deleteBy: " + deleteBy)
            }
        }

        const result = await pool.query(query, [id])
        if (result.rows.length === 0) { // if nothing was found to be deleted
            return {
                success: true,
                data: null
            }
        }
        else {
            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A ticket", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

module.exports = {
    comparePassword,
    createEndUser, createArtist, createCaterer, createEvent, createLocation, createReviewEvent, createReviewUser, createReviewLocation, createServiceArtist, createLied, createGericht, createPlaylist, createPlaylistInhalt, createTicket, createServiceArtist,
    getUserById, getUserByEmailandUsername , getStuffbyName , getLocationById,  getCatererById , getArtistByID, getAllTicketsFromUser, getArtistByEvent, getCatererByEvent, getPlaylistContent,
    searchEvent, searchLocaiton,searchCaterer, searchArtist, searchEndUser, updateArtist, updateCaterer, updateLocation,
    updateGericht, updateLied
};
