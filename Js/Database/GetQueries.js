const { pool } = require('./Database.js')
const cookieJwtAuth = require('../CookieJwtAuth')
const checkDistance = require('../CheckDistance')

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
            "SELECT c.*,a.id as userid,a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region,a-sterne FROM caterer c JOIN app_user a ON c.emailfk = a.email WHERE c.id = $1",
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

        
        const event = await pool.query(
            `SELECT e.*, l.adresse FROM event e JOIN servicecaterer sc ON sc.eventid = e.id JOIN location l ON e.locationid = l.id
            WHERE sc.catererid = $1::int`,
            [id]
        )
        console.log(event)

        return res.status(200).send({
            caterer: cater,
            gerichte: gericht,
            events : event
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
            "SELECT ar.*, a.id as userid,a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region,a.sterne FROM artist ar JOIN app_user a ON ar.emailfk = a.email WHERE ar.id = $1",
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

        const event = await pool.query(
            `SELECT e.*, l.adresse FROM event e JOIN serviceartist sa ON sa.eventid = e.id JOIN location l ON e.locationid = l.id
            WHERE sa.artistid = $1::int`,
            [id]
        )
        console.log(event)

        return res.status(200).send({
            artist: art,
            lieder: lied,
            events : event
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

async function getLocationReviewById(req,res){
    try {
        const result = await pool.query(
            "SELECT r.inhalt,r.sterne,a.profilname FROM review r JOIN app_user a ON r.ownerid = a.id WHERE r.locationid = $1::int",
            [req.params["id"]]
        )
        console.log(req.params["id"])
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send(null)
    }
}

async function getEventReviewById(req,res){
    try {
        const result = await pool.query(
            "SELECT r.inhalt,r.sterne,a.profilname FROM review r JOIN app_user a ON r.ownerid = a.id WHERE r.eventid = $1::int",
            [req.params["id"]]
        )
        console.log(req.params["id"])
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send(null)
    }
}

async function getPersonReviewById(req,res){
    try {
        const result = await pool.query(
            "SELECT r.inhalt,r.sterne,a.profilname FROM review r JOIN app_user a ON r.ownerid = a.id WHERE r.userid = $1::int",
            [req.params["id"]]
        )
        console.log(req.params["id"])
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send(null)
    }
}

async function searchEvent(req,res){
    console.log("REQUEST",req.body)
    const user = cookieJwtAuth.getUser(req.headers["auth"])["id"]
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
        if(Object.hasOwn(req.body,"distanz"))
        {
            const {standort,distanz} = req.body
            let row = result.rows
            for (let i=0;i<result.rowCount;i++)
            {
                if(row[i]["adresse"] == null)
                {
                
                    result.rows[i]["distanz"] = false 
                    continue
                }
                
                let isokay = await checkDistance(standort,row[i]["adresse"],distanz)
                isokay ? result.rows[i]["distanz"] = true : result.rows[i]["distanz"] = false
            } 
        }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an Event")
    }
}

async function searchLocaiton(req,res){
    console.log("REQUEST",req.body)
    const user = cookieJwtAuth.getUser(req.headers["auth"])["id"]
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
        if(Object.hasOwn(req.body,"distanz"))
            {
                const {standort,distanz} = req.body
                let row = result.rows
                for (let i=0;i<result.rowCount;i++)
                {
                    if(row[i]["adresse"] == null)
                    {
                    
                        result.rows[i]["distanz"] = false 
                        continue
                    }
                    
                    let isokay = await checkDistance(standort,row[i]["adresse"],distanz)
                    isokay ? result.rows[i]["distanz"] = true : result.rows[i]["distanz"] = false
                } 
            }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an location")
    }
}

async function searchCaterer(req,res){
    console.log("REQUEST",req.body)
    const user = cookieJwtAuth.getUser(req.headers["auth"])["id"]
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
        if(Object.hasOwn(req.body,"distanz"))
            {
                const {standort,distanz} = req.body
                let row = result.rows
                for (let i=0;i<result.rowCount;i++)
                {
                    if(row[i]["region"] == null)
                    {
                    
                        result.rows[i]["distanz"] = false 
                        continue
                    }
                    
                    let isokay = await checkDistance(standort,row[i]["region"],distanz)
                    isokay ? result.rows[i]["distanz"] = true : result.rows[i]["distanz"] = false
                } 
            }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an Caterer")
    }
}

async function searchArtist(req,res){
    console.log("REQUEST",req.body)
    const user = cookieJwtAuth.getUser(req.headers["auth"])["id"]
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
        if(Object.hasOwn(req.body,"distanz"))
            {
                const {standort,distanz} = req.body
                let row = result.rows
                for (let i=0;i<result.rowCount;i++)
                {
                    if(row[i]["region"] == null)
                    {
                    
                        result.rows[i]["distanz"] = false 
                        continue
                    }
                    
                    let isokay = await checkDistance(standort,row[i]["region"],distanz)
                    isokay ? result.rows[i]["distanz"] = true : result.rows[i]["distanz"] = false
                } 
            }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an Artist")
    }
}

async function searchEndUser(req,res){
    console.log("REQUEST",req.body)
    const user = cookieJwtAuth.getUser(req.headers["auth"])["id"]
    let query = "SELECT e.*,ap.profilname as name,ap.region,fu.userid AS favorit FROM endnutzer e JOIN app_user ap ON e.emailfk = ap.email"
    let additionalFilter = ""
    let istfavorit = " LEFT OUTER JOIN favorit_user fu ON e.id = fu.enduserid"
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
                break
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
        console.log(sqlstring)
        const result = await pool.query(sqlstring,param)
        for (let i=0;i<result.rowCount;i++)
        {
            //checks if the Enduser is a users Favorit
            if(Object.hasOwn(result.rows[i],"favorit")) {result.rows[i]["favorit"] == user ? result.rows[i]["favorit"] = true : result.rows[i]["favorit"] = false}
        }
        if(Object.hasOwn(req.body,"distanz"))
            {
                const {standort,distanz} = req.body
                let row = result.rows
                for (let i=0;i<result.rowCount;i++)
                {
                    if(row[i]["region"] == null)
                    {
                    
                        result.rows[i]["distanz"] = false 
                        continue
                    }
                    
                    let isokay = await checkDistance(standort,row[i]["region"],distanz)
                    isokay ? result.rows[i]["distanz"] = true : result.rows[i]["distanz"] = false
                } 
            }
        return res.send(result)
    } catch (err) {
        console.error(err)
        return res.status(400).send("Error while searching for an enduser")
    }
}

module.exports = {
    // GETS
    getUserById, 
    getUserByEmailandUsername, 
    getStuffbyName, 
    getLocationById,  
    getCatererById ,
    getArtistByID, 
    getAllTicketsFromUser,
    getArtistByEvent, 
    getCatererByEvent, 
    getPlaylistContent,
    getLocationReviewById,
    getEventReviewById,
    getPersonReviewById,
    // SEARCHES
    searchEvent, 
    searchLocaiton,
    searchCaterer, 
    searchArtist, 
    searchEndUser, 
}