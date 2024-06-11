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
        console.error(err)
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
        console.error(err)
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
        console.error(err)
        return false
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
            "INSERT INTO lied (ownerid, name, laenge, erscheinung) VALUES ($1::int, $2::text, $3::int, $4::date)",
            [ownerid,name,laenge,erscheinung]
        )
        console.log("Lied created")
        return ture
    } catch(err) {
        console.error(err)
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

async function getCatererByName(name){
    try {
        const result = await pool.query(
            "SELECT c.*,a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region FROM caterer c JOIN app_user a ON c.emailfk = a.email WHERE UPPER(a.benutzername) LIKE UPPER($1::text)",
            [`%${name}%`]
        )
        console.log(result)
        return result
    } catch (err) {
        console.error(err)
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
        console.error(err)
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
    const { fileTypeFromBuffer } = await import('file-type'); // Dynamischer Import
    console.log(req.body)

    let query = "SELECT e.*, l.name AS locationname FROM event e JOIN location l ON e.locationid = l.id"
    let additionalFilter = ""
    let param = []

    let paramIndex = 0;
    for (let key in req.body) {
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
                break
            default:
                // do nothing
                break
        }
        additionalFilter += " AND "
    }

    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '

    if (paramIndex == 0) { // no additional params
        try {
            const result = await pool.query(query)
            const events = await Promise.all(result.rows.map(async event => {
                let mimeType = 'application/octet-stream' // Standard-MIME-Typ
                if (event.bild) {
                    const type = await fileTypeFromBuffer(event.bild)
                    mimeType = type ? type.mime : mimeType
                }
                return {
                    ...event,
                    eventBild: event.bild ? `data:${mimeType};base64,${event.bild.toString('base64')}` : null
                }
            }))
            return res.send(events)
        } catch (err) {
            console.error(err)
            return res.status(400).send("Error while searching for an event")
        }
    }
        // with additional params
    try {
        const result = await pool.query(
            query += " WHERE " + additionalFilter,
            param
        )
        const events = await Promise.all(result.rows.map(async event => {
            let mimeType = 'application/octet-stream' // Standard-MIME-Typ
            if (event.bild) {
                const type = await fileTypeFromBuffer(event.bild)
                mimeType = type ? type.mime : mimeType
            }
            return {
                ...event,
                eventBild: event.bild ? `data:${mimeType};base64,${event.bild.toString('base64')}` : null
            }
        }))
        return res.send(events)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an event")
    }
}

async function searchLocaiton(req,res){
    const { fileTypeFromBuffer } = await import('file-type'); // Dynamischer Import
    console.log(req.body)

    let query = "SELECT * FROM location"
    let additionalFilter = ""
    let param = []

    let paramIndex = 0;
    for (let key in req.body) {
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
                paramIndex++
                additionalFilter += "kapazitaet >= $"+paramIndex+"::int"
                param.push(req.body[key])
                break
            case 'bewertung':
                console.error("BEWERTUNG NOT YET IMPLEMENTED")
                break
            case 'distanz':
                console.error("DISTANZ NOT YET IMPLEMENTED")
                break
            default:
                // do nothing
                break
        }
        additionalFilter += " AND "
    }

    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '
    if (paramIndex == 0) { // no additional params
        try {
            const result = await pool.query(query)
            const events = await Promise.all(result.rows.map(async event => {
                let mimeType = 'application/octet-stream' // Standard-MIME-Typ
                if (event.bild) {
                    const type = await fileTypeFromBuffer(event.bild)
                    mimeType = type ? type.mime : mimeType
                }
                return {
                    ...event,
                    eventBild: event.bild ? `data:${mimeType};base64,${event.bild.toString('base64')}` : null
                }
            }))
            return res.send(events)
        } catch (err) {
            console.error(err)
            return res.status(400).send("Error while searching for an event")
        }
    }

    // with additional params
    try {
        const result = await pool.query(
            query += " WHERE " + additionalFilter,
            param
            
        )
        const events = await Promise.all(result.rows.map(async event => {
            let mimeType = 'application/octet-stream' // Standard-MIME-Typ
            if (event.bild) {
                const type = await fileTypeFromBuffer(event.bild)
                mimeType = type ? type.mime : mimeType
            }
            return {
                ...event,
                eventBild: event.bild ? `data:${mimeType};base64,${event.bild.toString('base64')}` : null
            }
        }))
        return res.send(events)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an event")
    }
}

// Needs to be testet
async function searchCaterer(req,res){
    const { fileTypeFromBuffer } = await import('file-type'); // Dynamischer Import
    console.log(req.body)

    let query = "SELECT c.preis,c.kategorie,c.erfahrung,a.profilnamen,a.profilbild,a.kurzbeschreibung FROM caterer c JOIN app_user a ON c.emailfk = a.email"
    let additionalFilter = ""
    let param = []

    let paramIndex = 0;
    for (let key in req.body) {
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
                additionalFilter += "c.preis >= $"+paramIndex+"::text"
                param.push(req.body[key])
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
            default:
                // do nothing
                break
        }
        additionalFilter += " AND "
    }

    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '
    if (paramIndex == 0) { // no additional params
        try {
            const result = await pool.query(query)
            const events = await Promise.all(result.rows.map(async event => {
                let mimeType = 'application/octet-stream' // Standard-MIME-Typ
                if (event.bild) {
                    const type = await fileTypeFromBuffer(event.bild)
                    mimeType = type ? type.mime : mimeType
                }
                return {
                    ...event,
                    eventBild: event.bild ? `data:${mimeType};base64,${event.bild.toString('base64')}` : null
                }
            }))
            return res.send(events)
        } catch (err) {
            console.error(err)
            return res.status(400).send("Error while searching for an event")
        }
    }

    // with additional params
    try {
        const result = await pool.query(
            query += " WHERE " + additionalFilter,
            param
            
        )
        const events = await Promise.all(result.rows.map(async event => {
            let mimeType = 'application/octet-stream' // Standard-MIME-Typ
            if (event.bild) {
                const type = await fileTypeFromBuffer(event.bild)
                mimeType = type ? type.mime : mimeType
            }
            return {
                ...event,
                eventBild: event.bild ? `data:${mimeType};base64,${event.bild.toString('base64')}` : null
            }
        }))
        return res.send(events)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an event")
    }
}
// Needs to be testet
async function searchArtist(req,res){
    const { fileTypeFromBuffer } = await import('file-type'); // Dynamischer Import
    console.log(req.body)

    let query = "SELECT a.preis,a.kategorie,a.erfahrung,ap.profilnamen,ap.profilbild,ap.kurzbeschreibung FROM artist a JOIN app_user ap ON a.emailfk = ap.email"
    let additionalFilter = ""
    let param = []

    let paramIndex = 0;
    for (let key in req.body) {
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
                paramIndex++
                additionalFilter += "a.preis >= $"+paramIndex+"::text"
                param.push(req.body[key])
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
            default:
                // do nothing
                break
        }
        additionalFilter += " AND "
    }

    additionalFilter = additionalFilter.substring(0,additionalFilter.length-5) // remove the last ' AND '
    if (paramIndex == 0) { // no additional params
        try {
            const result = await pool.query(query)
            const events = await Promise.all(result.rows.map(async event => {
                let mimeType = 'application/octet-stream' // Standard-MIME-Typ
                if (event.bild) {
                    const type = await fileTypeFromBuffer(event.bild)
                    mimeType = type ? type.mime : mimeType
                }
                return {
                    ...event,
                    eventBild: event.bild ? `data:${mimeType};base64,${event.bild.toString('base64')}` : null
                }
            }))
            return res.send(events)
        } catch (err) {
            console.error(err)
            return res.status(400).send("Error while searching for an event")
        }
    }

    // with additional params
    try {
        const result = await pool.query(
            query += " WHERE " + additionalFilter,
            param
            
        )
        const events = await Promise.all(result.rows.map(async event => {
            let mimeType = 'application/octet-stream' // Standard-MIME-Typ
            if (event.bild) {
                const type = await fileTypeFromBuffer(event.bild)
                mimeType = type ? type.mime : mimeType
            }
            return {
                ...event,
                eventBild: event.bild ? `data:${mimeType};base64,${event.bild.toString('base64')}` : null
            }
        }))
        return res.send(events)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an event")
    }
}

module.exports = {
    comparePassword,
    createEndUser, createArtist, createCaterer, createEvent, createLocation, createReviewEvent, createReviewUser, createReviewLocation, createServiceArtist, createLied, createGericht, createPlaylist, createPlaylistInhalt, createTicket, createServiceArtist,
    getUserById, getUserByEmailandUsername , getStuffbyName , getLocationById, getCatererByName , getArtistByName, getAllTicketsFromUser, getArtistByEvent, getCatererByEvent, getPlaylistContent,
    searchEvent, searchLocaiton,searchCaterer, searchArtist
};
