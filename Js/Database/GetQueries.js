const { pool } = require('./Database.js')
const jwt = require('jsonwebtoken')
const checkDistance = require('../CheckDistance.js')
SECRET = "BruhnsmanIsTheBest"

/**
 * Checks the DB if an account with the given email or benutzername already exists
 * @param {!string} email 
 * @param {!string} benutzername 
 * @returns {!Object}
 * - boolean: success - true if successful, false otherwise
 * - exists: boolean - true if account already exists, false otherwise
 * - error: error - null if none occoured
 */
async function checkIfAccountIsInUse(email, benutzername){
    try {
        const result = await pool.query(
            `SELECT EXISTS (
                SELECT 1
                FROM app_user
                WHERE email = $1::text 
                OR benutzername = $2::text
            )`,
            [email, benutzername]
        )
        return {
            success: true,
            exists: result.rows[0].exists,
            error: null
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            exists: null,
            error: err
        }
    }
}

// -------------------- SEARCHES -------------------- //

/**
 * Searches for events with parameters given in the req.body
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function searchEvent(req, res) {
    console.log("REQUEST searchEvent", req.body);
    let userid;
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"];
        if (userid === undefined) throw new Error("INVALID TOKEN");
    } catch (err) {
        console.error(err);
        return res.status(400).send(err.toString());
    }

    let query = `
        SELECT 
            e.*,
            l.name AS locationname,
            l.adresse as adresse,
            fe.userid as favorit,
            bild.data AS bild
        FROM event e 
        JOIN location l ON e.locationid = l.id
        LEFT JOIN bild ON e.bildid = bild.id`;
    let additionalFilter = "";
    let param = [];
    let istfavorit = " LEFT OUTER JOIN favorit_event fe ON e.id = fe.eventid";
    let ticktjoin = "";
    let paramIndex = 0;
    let doAND;

    for (let key in req.body) {
        doAND = true;
        switch (key) {
            case 'openair':
                additionalFilter += "(l.openair = true)";
                break;
            case 'search':
                paramIndex++;
                additionalFilter += `(UPPER(e.name) LIKE UPPER ($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'datum':
                paramIndex++;
                additionalFilter += `(e.datum = $${paramIndex}::date)`;
                param.push(req.body[key]);
                break;
            case 'uhrzeit':
                paramIndex++;
                additionalFilter += `(e.startuhrzeit BETWEEN $${paramIndex} AND `;
                param.push((req.body[key])[0] === '' ? "00:00" : (req.body[key])[0]);
                paramIndex++;
                additionalFilter += `$${paramIndex})`;
                param.push((req.body[key])[1] === '' ? "23:59" : (req.body[key])[1]);
                break;
            case 'eventgroesse':
                paramIndex++;
                additionalFilter += `(e.eventgroesse >= $${paramIndex}::int)`;
                param.push(req.body[key]);
                break;
            case 'altersfreigabe':
                paramIndex++;
                additionalFilter += `(e.altersfreigabe >= $${paramIndex}::int)`;
                param.push(req.body[key]);
                break;
            case 'region':
                paramIndex++;
                additionalFilter += `(UPPER(l.adresse) LIKE UPPER ($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'distanz':
                doAND = false;
                break;
            case 'istbesitzer':
                paramIndex++;
                additionalFilter += `(e.ownerid = $${paramIndex}::int)`;
                param.push(userid);
                break;
            case 'dauer':
                paramIndex += 2;
                additionalFilter += `(e.dauer BETWEEN $${paramIndex - 1}::int AND $${paramIndex}::int)`;
                param.push((req.body[key])[0] === '' ? "0" : (req.body[key])[0],
                            (req.body[key])[1] === '' ? "1000" : (req.body[key])[1]);
                break;
            case 'hatticket':
                paramIndex++;
                ticktjoin += " JOIN tickets t ON e.id = t.eventid";
                additionalFilter += `t.userid = $${paramIndex}::int`;
                param.push(userid);
                break;
            case 'istfavorit':
                paramIndex++;
                additionalFilter += `(fe.userid = $${paramIndex}::int)`;
                param.push(userid);
                break;
            case 'preis':
                paramIndex += 2;
                additionalFilter += `(e.preis BETWEEN $${paramIndex - 1}::text AND $${paramIndex}::text)`;
                param.push((req.body[key])[0] === '' ? "0" : (req.body[key])[0],
                        (req.body[key])[1] === '' ? "999999" : (req.body[key])[1]);
                break;
            default:
                doAND = false;
                break;
        }
        if (doAND) additionalFilter += " AND ";
    }

    paramIndex++;
    additionalFilter += `
        (
            e.privat = false
            OR e.ownerid = $${paramIndex}::int
            OR (
                e.privat = true
                AND EXISTS (
                    SELECT 1
                    FROM friend f
                    WHERE f.user1 = $${paramIndex}::int
                    AND f.user2 = e.ownerid
                )
            )
        )`
    param.push(userid);

    if (additionalFilter.endsWith(" AND ")) {
        additionalFilter = additionalFilter.slice(0, -5);
    }

    let sqlstring = query + istfavorit + ticktjoin + (additionalFilter ? " WHERE " + additionalFilter : "");
    console.log("Event SQL:\n",sqlstring,"\nWith DATA:", param)
    try {
        console.log("QUERY SEARCH", sqlstring);
        const result = await pool.query(sqlstring, param);
        for (let i = 0; i < result.rowCount; i++) {
            if (Object.hasOwn(result.rows[i], "favorit")) {
                result.rows[i]["favorit"] = result.rows[i]["favorit"] == userid;
            }
        }
        if (Object.hasOwn(req.body, "distanz")) {
            const { standort, distanz } = req.body;
            let row = result.rows;
            for (let i = 0; i < result.rowCount; i++) {
                if (row[i]["adresse"] == null) {
                    result.rows[i]["distanz"] = false;
                    continue;
                }
                let isokay = await checkDistance(standort, row[i]["adresse"], distanz);
                result.rows[i]["distanz"] = isokay;
            }
        }
        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(`Error while searching for an Event: ${err.toString()}`);
    }
}

/**
 * Searches for locations with parameters given in the req.body
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function searchLocation(req, res) {
    console.log("REQUEST searchLocation", req.body);
    let userid;
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"];
        if (userid === undefined) throw new Error("INVALID TOKEN");
    } catch (err) {
        console.error(err);
        return res.status(400).send(err.toString());
    }

    let query = `
        SELECT 
            location.*,
            favorit_location.userid as favorit,
            bild.data AS bild
        FROM location
        LEFT JOIN bild ON location.bildid = bild.id`;
    
    let additionalFilter = "";
    let istfavorit = " LEFT OUTER JOIN favorit_location ON location.id = favorit_location.locationid";
    let params = [];
    let sqlstring = "";
    let paramIndex = 0;
    let doAND;
    
    for (let key in req.body) {
        doAND = true;
        switch (key) {
            case 'openair':
                paramIndex++;
                additionalFilter += `(openair = $${paramIndex}::boolean)`;
                params.push(req.body[key]);
                break;
            case 'search':
                paramIndex++;
                additionalFilter += `(UPPER(name) LIKE UPPER($${paramIndex}))`;
                params.push(`%${req.body[key]}%`);
                break;
            case 'region':
                paramIndex++;
                additionalFilter += `(UPPER(adresse) LIKE UPPER($${paramIndex}))`;
                params.push(`%${req.body[key]}%`);
                break;
            case 'preis':
                paramIndex++;
                additionalFilter += `(preis >= $${paramIndex}::text)`;
                params.push(req.body[key]);
                break;
            case 'kapazitaet':
                paramIndex += 2;
                additionalFilter += `(kapazitaet BETWEEN $${paramIndex - 1}::int AND $${paramIndex}::int)`;
                params.push(req.body[key][0], req.body[key][1]);
                break;
            case 'distanz':
                doAND = false;
                break;
            case 'istfavorit':
                paramIndex++;
                additionalFilter += `(favorit_location.userid = $${paramIndex}::int)`;
                params.push(userid);
                break;
            case 'istbesitzer':
                paramIndex++;
                additionalFilter += `(ownerid = $${paramIndex}::int)`;
                params.push(userid);
                break;
            case 'bewertung':
                paramIndex++;
                additionalFilter += `(sterne >= $${paramIndex}::int)`;
                params.push(req.body[key]);
                break;
            default:
                doAND = false;
                break;
        }
        if (doAND) additionalFilter += " AND ";
    }

    paramIndex++;
    additionalFilter += `(location.privat = false OR location.ownerid = $${paramIndex}::int)`;
    params.push(userid);
    
    if (additionalFilter.endsWith(" AND ")) {
        additionalFilter = additionalFilter.slice(0, -5);
    }

    sqlstring = query + istfavorit + (additionalFilter ? " WHERE " + additionalFilter : "");
    console.log("Location SQL:\n",sqlstring,"\nWith DATA:", params)
    try {
        const result = await pool.query(sqlstring, params);
        for (let i = 0; i < result.rowCount; i++) {
            if (Object.hasOwn(result.rows[i], "favorit")) {
                result.rows[i]["favorit"] = result.rows[i]["favorit"] == userid;
            }
        }
        if (Object.hasOwn(req.body, "distanz")) {
            const { standort, distanz } = req.body;
            let row = result.rows;
            for (let i = 0; i < result.rowCount; i++) {
                if (row[i]["adresse"] == null) {
                    result.rows[i]["distanz"] = false;
                    continue;
                }
                let isokay = await checkDistance(standort, row[i]["adresse"], distanz);
                result.rows[i]["distanz"] = isokay;
            }
        }
        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(`Error while searching for a Location: ${err.toString()}`);
    }
}

/**
 * Searches for caterer with parameters given in the req.body
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function searchCaterer(req, res) {
    console.log("REQUEST searchCaterer", req.body);
    let user;

    try {
        user = jwt.verify(req.headers["auth"], SECRET)["id"];
        if (!user) throw new Error("INVALID TOKEN");
    } catch (err) {
        console.error(err);
        return res.status(400).send(err.toString());
    }

    let query = `
        SELECT 
            c.preis,
            c.kategorie,
            c.erfahrung,
            c.id,
            a.profilname as name,
            a.region,
            a.bildid,
            a.kurzbeschreibung,
            a.sterne,
            a.id AS app_user_id,
            fu.userid AS favorit,
            bild.data AS profilbild
        FROM caterer c 
        JOIN app_user a ON c.emailfk = a.email
        LEFT JOIN bild ON a.bildid = bild.id`;

    let additionalFilter = "";
    let param = [];
    let istfavorit = " LEFT OUTER JOIN favorit_user fu ON c.id = fu.catereid";
    let paramIndex = 0;
    let doAND;

    for (let key in req.body) {
        doAND = true;
        switch (key) {
            case 'openair':
                paramIndex++;
                additionalFilter += `(c.openair = $${paramIndex}::boolean)`;
                param.push(req.body[key]);
                break;
            case 'search':
                paramIndex++;
                additionalFilter += `(UPPER(a.profilname) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'region':
                paramIndex++;
                additionalFilter += `(UPPER(a.region) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'preis':
                paramIndex += 2;
                additionalFilter += `(c.preis BETWEEN $${paramIndex - 1}::text AND $${paramIndex}::text)`;
                param.push((req.body[key])[0] === '' ? "0" : (req.body[key])[0]);
                param.push((req.body[key])[1] === '' ? "9999999" : (req.body[key])[1]);
                break;
            case 'erfahrung':
                paramIndex++;
                additionalFilter += `(c.erfahrung >= $${paramIndex}::text)`;
                param.push(req.body[key]);
                break;
            case 'kategorie':
                paramIndex++;
                additionalFilter += `(UPPER(c.kategorie) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'istfavorit':
                paramIndex++;
                additionalFilter += `(fu.userid = $${paramIndex}::int)`;
                param.push(user);
                break;
            default:
                doAND = false;
                break;
        }
        if (doAND) additionalFilter += " AND ";
    }

    additionalFilter = additionalFilter.slice(0, -5); // remove the last ' AND '
    let sqlstring = paramIndex === 0 ? query + istfavorit : query + istfavorit + " WHERE " + additionalFilter;
    console.log("caterer SQL:\n",sqlstring,"\nWith DATA:", param)
    try {
        const result = await pool.query(sqlstring, param);

        for (let i = 0; i < result.rowCount; i++) {
            if (Object.hasOwn(result.rows[i], "favorit")) {
                result.rows[i]["favorit"] = result.rows[i]["favorit"] === user;
            }
        }

        if (Object.hasOwn(req.body, "distanz")) {
            const { standort, distanz } = req.body;
            for (let row of result.rows) {
                if (!row["region"]) {
                    row["distanz"] = false;
                    continue;
                }
                row["distanz"] = await checkDistance(standort, row["region"], distanz);
            }
        }

        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(`Error while searching for a Caterer: ${err.toString()}`);
    }
}

/**
 * Searches for artists with parameters given in the req.body
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function searchArtist(req, res) {
    console.log("REQUEST searchArtist", req.body);
    let user;

    try {
        user = jwt.verify(req.headers["auth"], SECRET)["id"];
        if (!user) throw new Error("INVALID TOKEN");
    } catch (err) {
        console.error(err);
        return res.status(400).send(err.toString());
    }

    let query = `
        SELECT 
            a.preis,
            a.kategorie,
            a.erfahrung,
            a.id,
            ap.id AS app_user_id,
            ap.region,
            ap.profilname as name,
            ap.sterne,
            ap.bildid,
            ap.kurzbeschreibung,
            fu.userid AS favorit,
            bild.data AS profilbild
        FROM artist a 
        JOIN app_user ap ON a.emailfk = ap.email
        LEFT JOIN bild ON ap.bildid = bild.id`;

    let additionalFilter = "";
    let istfavorit = " LEFT OUTER JOIN favorit_user fu ON a.id = fu.artistid";
    let param = [];
    let paramIndex = 0;
    let doAND = true;

    for (let key in req.body) {
        doAND = true;
        switch (key) {
            case 'search':
                paramIndex++;
                additionalFilter += `(UPPER(ap.profilname) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'region':
                paramIndex++;
                additionalFilter += `(UPPER(ap.region) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'preis':
                paramIndex += 2;
                additionalFilter += `(a.preis BETWEEN $${paramIndex - 1}::text AND $${paramIndex}::text)`;
                param.push((req.body[key])[0] === '' ? "0" : (req.body[key])[0]);
                param.push((req.body[key])[1] === '' ? "9999999" : (req.body[key])[1]);
                break;
            case 'erfahrung':
                paramIndex++;
                additionalFilter += `(a.erfahrung >= $${paramIndex}::text)`;
                param.push(req.body[key]);
                break;
            case 'kategorie':
                paramIndex++;
                additionalFilter += `(UPPER(a.kategorie) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'bewertung':
                paramIndex++;
                additionalFilter += `(ap.sterne >= $${paramIndex}::int)`;
                param.push(req.body[key]);
                break;
            case 'istfavorit':
                paramIndex++;
                additionalFilter += `(fu.userid = $${paramIndex}::int)`;
                param.push(user);
                break;
            default:
                doAND = false;
                break;
        }
        if (doAND) additionalFilter += " AND ";
    }

    additionalFilter = additionalFilter.slice(0, -5); // remove the last ' AND '
    let sqlstring = paramIndex === 0 ? query + istfavorit : query + istfavorit + " WHERE " + additionalFilter;
    console.log("Artist SQL:\n",sqlstring,"\nWith DATA:", param)
    try {
        const result = await pool.query(sqlstring, param);

        for (let i = 0; i < result.rowCount; i++) {
            if (Object.hasOwn(result.rows[i], "favorit")) {
                result.rows[i]["favorit"] = result.rows[i]["favorit"] === user;
            }
        }

        if (Object.hasOwn(req.body, "distanz")) {
            const { standort, distanz } = req.body;
            for (let row of result.rows) {
                if (!row["region"]) {
                    row["distanz"] = false;
                    continue;
                }
                row["distanz"] = await checkDistance(standort, row["region"], distanz);
            }
        }

        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(`Error while searching for an Artist: ${err.toString()}`);
    }
}

/**
 * Searches for endusers with parameters given in the req.body
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function searchEndUser(req, res) {
    console.log("REQUEST searchEndUser", req.body);
    let user;

    try {
        user = jwt.verify(req.headers["auth"], SECRET)["id"];
        if (!user) throw new Error("INVALID TOKEN");
    } catch (err) {
        console.error(err);
        return res.status(400).send(err.toString());
    }

    let query = `
        SELECT 
            e.*,
            ap.id AS app_user_id,
            ap.profilname AS name,
            ap.region,
            fu.userid AS favorit,
            ap.bildid,
            bild.data AS profilbild
        FROM endnutzer e 
        JOIN app_user ap ON e.emailfk = ap.email
        LEFT JOIN bild ON ap.bildid = bild.id`;

    let additionalFilter = "";
    let istfavorit = " LEFT OUTER JOIN favorit_user fu ON e.id = fu.enduserid ";
    let isfriend = " LEFT OUTER JOIN friend fr ON ap.id = fr.user2 "
    let param = [];
    let paramIndex = 0;
    let doAND = true;

    for (let key in req.body) {
        doAND = true;
        switch (key) {
            case 'search':
                paramIndex++;
                additionalFilter += `(UPPER(ap.profilname) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'region':
                paramIndex++;
                additionalFilter += `(UPPER(ap.region) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'geschlecht':
                if (req.body[key] === null) break
                paramIndex++;
                additionalFilter += `(UPPER(e.geschlecht) LIKE UPPER($${paramIndex}))`;
                param.push(`%${req.body[key]}%`);
                break;
            case 'alter':
                paramIndex++;
                additionalFilter += `(e.alter >= $${paramIndex}::int)`;
                param.push(req.body[key]);
                break;
            case 'istfavorit':
                paramIndex++;
                additionalFilter += `(fu.userid = $${paramIndex}::int)`;
                param.push(user);
                break;
            case 'istfreund':
                paramIndex++;
                additionalFilter += `(fr.user1 = $${paramIndex}::int)`;
                param.push(user);
                break;
            default:
                doAND = false;
                break;
        }
        if (doAND) additionalFilter += " AND ";
    }

    additionalFilter = additionalFilter.slice(0, -5); // remove the last ' AND '
    let sqlstring = paramIndex === 0 ? query + istfavorit + isfriend : query + istfavorit + isfriend + "WHERE " + additionalFilter;

    console.log("Enduser SQL:\n",sqlstring,"\nWith DATA:", param)

    try {
        const result = await pool.query(sqlstring, param);

        for (let i = 0; i < result.rowCount; i++) {
            if (Object.hasOwn(result.rows[i], "favorit")) {
                result.rows[i]["favorit"] = result.rows[i]["favorit"] === user;
            }
        }

        if (Object.hasOwn(req.body, "distanz")) {
            const { standort, distanz } = req.body;
            for (let row of result.rows) {
                if (!row["region"]) {
                    row["distanz"] = false;
                    continue;
                }
                row["distanz"] = await checkDistance(standort, row["region"], distanz);
            }
        }

        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(`Error while searching for an enduser: ${err.toString()}`);
    }
}

// -------------------- GETS -------------------- //

/**
 * Gets all partybilder from an app_user
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getPartybilderFromUser(req, res) {
    try {
        const result = await pool.query(
            `SELECT 
                pb.id AS partybilder_id,
                bild.data AS partybild_data
            FROM partybilder pb
            JOIN bild ON pb.bildid = bild.id
            WHERE pb.userid = $1::int`,
            [req.params['id']]
        )
        res.status(200).send(result)
    } catch (err) {
        console.error(err)
        res.status(500).send(toString(err))
    }
}

/**
 * Gets a specific location via its id
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getLocationById(req,res){
    let userid
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    try {
        const result = await pool.query(
            `SELECT 
                l.*, bild.data AS bild 
            FROM location l 
            LEFT JOIN bild ON bildid = bild.id 
            WHERE l.id = $1::int`,
            [req.params["id"]]
        )
        return res.status(200).send({
            result: result,
            isOwner: userid === result.rows[0]['ownerid'] ? true : false
        })
    } catch (err) {
        console.error(err)
        return res.status(500).send("INTERNAL SERVER ERROR WHILE TRYING TO GET LOCATION BY ID")
    }
}

/**
 * Gets a specific event via its id
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getEventById(req,res){
    try {
        let userid
        try {
            userid = jwt.verify(req.headers["auth"], SECRET)["id"]
            if (userid == undefined) throw new Error("INVALID TOKEN")
        } catch(err) {
            console.error(err)
            return res.status(400).send(toString(err))
        } 

        const id = req.params["id"]
        const event = await pool.query(
            `SELECT 
                e.*,
                l.adresse,
                l.name as locationname,
                l.openair,
                CASE
                    WHEN e.bildid IS NOT NULL THEN bild.data
                    ELSE NULL
                END AS bild
            FROM event e 
            JOIN location l ON e.locationid = l.id 
            LEFT JOIN bild ON e.bildid = bild.id
            WHERE e.id = $1::int`,
            [id]
        )
        const artist = await getArtistByEvent(req.params["id"])
        const caterer = await getCatererByEvent(req.params["id"])
        return res.status(200).send({
            event: event,
            artists: artist,
            caterers : caterer,
            isOwner: userid === event.rows[0]['ownerid'] ? true : false
        })
    } catch (err) {
        console.error(err)
        return res.status(500).send("INTERNAL SERVER ERROR WHILE TRYING TO GET EVENT BY ID")
    }
}

/**
 * Gets a specific caterer via its id
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getCatererById(req,res){
    const id = req.params["id"]
    let userid
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 
    try {
        const cater = await pool.query(
            `SELECT 
                c.*,
                a.id as userid,
                a.benutzername,
                a.profilname,
                a.bildid,
                a.kurzbeschreibung,
                a.beschreibung,
                a.region,
                a.sterne,
                bild.data AS profilbild
            FROM caterer c 
            JOIN app_user a ON c.emailfk = a.email 
            LEFT JOIN bild ON a.bildid = bild.id
            WHERE c.id = $1`,
            [id]
        )

        const gericht = await pool.query(
            `SELECT 
                g.id, 
                g.name, 
                g.beschreibung, 
                g.bildid,
                bild.data AS bild
            FROM gericht g
            LEFT JOIN bild ON g.bildid = bild.id
            WHERE g.ownerid = $1::int`,
            [id]
        )

        const event = await pool.query(
            `SELECT 
                e.*, 
                l.adresse,
                bild.data AS bild
            FROM event e 
            JOIN servicecaterer sc ON sc.eventid = e.id 
            JOIN location l ON e.locationid = l.id
            LEFT JOIN bild ON e.bildid = bild.id
            WHERE sc.catererid = $1::int`,
            [id]
        )

        if (cater.rowCount == 0) return res.status(400).send("No caterer found")

        return res.status(200).send({
            isOwner : userid === cater.rows[0]['userid'] ? true : false,
            caterer: cater,
            gerichte: gericht,
            events : event
        })
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets a specific artist via its id
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getArtistByID(req,res){
    const id = req.params["id"]
    let userid
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 
    try {
        const art = await pool.query(
            `SELECT 
                ar.*, 
                a.id as userid,
                a.benutzername, 
                a.profilname,
                a.bildid,
                a.kurzbeschreibung,
                a.beschreibung,
                a.region,
                a.sterne,
                bild.data AS profilbild 
            FROM artist ar 
            JOIN app_user a ON ar.emailfk = a.email
            LEFT JOIN bild ON a.bildid = bild.id
            WHERE ar.id = $1`,
            [id]
        )

        const lied = await pool.query(
            `SELECT 
                l.id,
                l.name,
                l.laenge,
                l.erscheinung
            FROM lied l
            WHERE l.ownerid = $1::int`,
            [id]
        )

        const event = await pool.query(
            `SELECT 
                e.*, 
                l.adresse,
                bild.data AS bild
            FROM event e 
            JOIN serviceartist sa ON sa.eventid = e.id 
            JOIN location l ON e.locationid = l.id
            LEFT JOIN bild ON e.bildid = bild.id
            WHERE sa.artistid = $1::int`,
            [id]
        )

        if (art.rowCount == 0) return res.status(400).send("No artist found")

        return res.status(200).send({
            isOwner : userid === art.rows[0]['userid'] ? true : false,
            artist: art,
            lieder: lied,
            events : event
        })
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets a specific endnutzer via its id
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getEndUserById(req,res){
    let userid
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }
    try {
        const id = req.params["id"]
        const user = await pool.query(
            `SELECT 
                e.*,
                a.benutzername,
                a.profilname,
                a.bildid,
                a.kurzbeschreibung,
                a.beschreibung,
                a.region,
                a.sterne,
                a.id as userid,
                bild.data AS profilbild
            FROM endnutzer e
            JOIN app_user a ON a.email = e.emailfk
            LEFT JOIN bild ON a.bildid = bild.id
            WHERE a.id = $1::int`,
            [id]
        )
        
        const location = await pool.query(
            `SELECT 
                l.*,
                bild.data AS profilbild
            FROM location l
            LEFT JOIN bild ON l.bildid = bild.id
            WHERE l.ownerid = $1::int`,
            [id]
        )
        

        const owenevent = await pool.query(
            `SELECT 
                e.*,
                l.adresse,
                l.name as locationname,
                bild.data AS profilbild
            FROM event e
            LEFT JOIN bild ON e.bildid = bild.id
            JOIN location l ON e.locationid = l.id
            WHERE e.ownerid = $1::int`,
            [id]
        )

        const ticket = await pool.query(
            `SELECT 
                e.*,
                l.adresse,
                l.name as locationname,
                bild.data AS profilbild
            FROM event e
            LEFT JOIN bild ON e.bildid = bild.id
            LEFT JOIN tickets t ON e.id = t.eventid
            JOIN location l ON e.locationid = l.id
            WHERE t.userid = $1::int`,
            [id]
        )

        if (user.rowCount == 0) return res.status(400).send("No user found")

        return res.status(200).send({
            isMe : userid === user.rows[0]['userid'] ? true : false,
            user : user,
            locations : location,
            owenevents : owenevent,
            tickets :  ticket
        })
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets all tickets from a user
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getAllTicketsFromUser(req,res){
    let userid
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 

    try {
        const result = await pool.query(
            "SELECT name FROM event  JOIN tickets ON tickets.eventid = event.id WHERE tickets.userid = $1::int",
            [userid]
        )
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets all dates of events where tickets have been booked
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getBookedTicketsDate(req, res) {
    let user
    try
    {
        user = jwt.verify(req.headers["auth"], SECRET)["id"]
        if (user == undefined) throw new Error("INVALID TOKEN")
    }
    catch(err)
    {
        console.error(err)
        return res.status(400).send(toString(err))
    }   

    try {
        const result = await pool.query(
            `SELECT 
                datum
            FROM
                tickets
            JOIN
                event ON tickets.eventid = event.id
            WHERE
                tickets.userid = = $1::int`,
            [user]
        )
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets all reviews for a location via the locationid
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getLocationReviewById(req,res){
    try {
        const result = await pool.query(
            "SELECT r.inhalt,r.sterne,a.profilname FROM review r JOIN app_user a ON r.ownerid = a.id WHERE r.locationid = $1::int",
            [req.params["id"]]
        )
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets all reviews for an event via the eventid
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getEventReviewById(req,res){
    try {
        const result = await pool.query(
            "SELECT r.inhalt,r.sterne,a.profilname FROM review r JOIN app_user a ON r.ownerid = a.id WHERE r.eventid = $1::int",
            [req.params["id"]]
        )
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets all reviews for an app_user via the app_userid
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getPersonReviewById(req,res){
    try {
        const result = await pool.query(
            "SELECT r.inhalt,r.sterne,a.profilname FROM review r JOIN app_user a ON r.ownerid = a.id WHERE r.userid = $1::int",
            [req.params["id"]]
        )
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets all mails from a user
 * @param {!JSON} req 
 * @param {!JSON} res 
 */
async function getMails(req, res) {
    let userid
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    }  

    try {
        const mails = await pool.query(
            `SELECT 
                mail.id,
                mail.anfrage AS anfragetyp,
                mail.gelesen,
                mail.angenommen,
                app_user.email AS senderemail, 
                app_user.profilname AS sendername,
                empfaenger.profilname AS empfaengername,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN event.name
                    ELSE NULL
                END AS eventname,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN event.preis
                    ELSE NULL
                END AS ticketpreis,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN event.altersfreigabe
                    ELSE NULL
                END AS altersfreigabe,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN event.datum
                    ELSE NULL
                END AS datum,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN event.startuhrzeit
                    ELSE NULL
                END AS startuhrzeit,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN event.enduhrzeit
                    ELSE NULL
                END AS enduhrzeit,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN event.dauer
                    ELSE NULL
                END AS dauer,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN location.name
                    ELSE NULL
                END AS locationname,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN location.adresse
                    ELSE NULL
                END AS locationadresse,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN location.openair
                    ELSE NULL
                END AS locationopenair,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN location.flaeche
                    ELSE NULL
                END AS locationflaeche,
                CASE 
                    WHEN mail.eventid IS NOT NULL THEN location.kapazitaet
                    ELSE NULL
                END AS locationkapazitaet,
                app_user.bildid,
                bild.data AS senderprofilbild
            FROM mail 
            LEFT JOIN event ON mail.eventid = event.id
            LEFT JOIN location ON event.locationid = location.id
            JOIN app_user ON mail.sender = app_user.id
            JOIN app_user AS empfaenger ON mail.empfaenger = empfaenger.id
            LEFT JOIN bild ON app_user.bildid = bild.id
            WHERE mail.empfaenger = $1::int`,
            [userid]
        )
        return res.status(200).send(mails)
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

/**
 * Gets all friends from a user
 * @param {*} req 
 * @param {*} res 
 */
async function getFriends(req,res){
    let userid
    try {
        userid = jwt.verify(req.headers["auth"], SECRET)["id"]
        if (userid == undefined) throw new Error("INVALID TOKEN")
    } catch(err) {
        console.error(err)
        return res.status(400).send(toString(err))
    } 
    try {
        const result = await pool.query(
            `SELECT 
                a.id,
                a.benutzername,
                a.profilname,
                a.email,
                a.kurzbeschreibung,
                a.beschreibung,
                a.region,
                a.sterne,
                a.bildid,
                b.data AS profilbild
            FROM app_user a 
            JOIN friend f ON a.id = user2
            LEFT JOIN bild b ON a.bildid = b.id
	        WHERE 
                f.user1 = $1::int
                AND
	            a.id != $1::int`,
            [userid]
        )
        return res.status(200).send(result)
    } catch (err) {
        console.error(err)
        return res.status(500).send(toString(err))
    }
}

// -------------------- PRIVATE -------------------- //

async function getArtistByEvent(id){
    try {
        const result = await pool.query(
            `SELECT 
                ar.*,
                a.benutzername,
                a.profilname,
                a.bildid,
                a.kurzbeschreibung,
                a.beschreibung,
                a.region,
                a.sterne,
                bild.data AS profilbild 
            FROM artist ar 
            JOIN app_user a ON ar.emailfk = a.email 
            JOIN serviceartist sa ON sa.artistid = ar.id 
            JOIN event e ON e.id = sa.eventid
            LEFT JOIN bild ON a.bildid = bild.id
            WHERE sa.eventid = $1::int`,
            [id]
        )
        return result
    } catch (err) {
        console.error(err)
        return null
    }
}

async function getCatererByEvent(id){
    try {
        const result = await pool.query(
            `SELECT 
                c.*,
                a.benutzername,
                a.profilname,
                a.bildid,
                a.kurzbeschreibung,
                a.beschreibung,
                a.region,
                a.sterne,
                bild.data AS profilbild 
            FROM caterer c 
            JOIN app_user a ON c.emailfk = a.email 
            JOIN servicecaterer sc ON sc.catererid = c.id 
            JOIN event e ON e.id = sc.eventid
            LEFT JOIN bild ON a.bildid = bild.id
            WHERE sc.eventid = $1::int`,
            [id]
        )
        return result
    } catch (err) {
        console.error(err)
        return null
    }
}

module.exports = {
    // GETS 
    checkIfAccountIsInUse,
    getLocationById,  
    getCatererById ,
    getArtistByID, 
    getEndUserById,
    getAllTicketsFromUser,
    getLocationReviewById,
    getEventReviewById,
    getPersonReviewById,
    getEventById,
    getMails,
    getBookedTicketsDate,
    getPartybilderFromUser,
    getFriendId: getFriends,
    // SEARCHES
    searchEvent, 
    searchLocaiton: searchLocation, // to not destroy the code by mistakes in refactoring, just point it to the right function
    searchCaterer, 
    searchArtist, 
    searchEndUser, 
}