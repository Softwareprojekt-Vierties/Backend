const { pool } = require('./Database.js')
const createQueries = require("./CreateQueries.js")  
const DeleteQueries = require("./DeleteQueries.js")
const CreateQueries = require("./CreateQueries.js")
const bcrypt = require('bcrypt')
const cookieJwtAuth = require('../CookieJwtAuth')

// -------------------- PRIVATE -------------------- //

/**
 * Updates the app_user.
 * @param {string} profilname
 * @param {string} profilbild 
 * @param {string} kurzbeschreibung 
 * @param {string} beschreibung 
 * @param {string} region 
 * @param {!string} email - must be given, used as reference
 * @returns {!Object}
 * - boolean: success - true if successful, false otherwise
 * - Error: error - the error if one occured
 */
async function updateApp_user(profilname, profilbild, kurzbeschreibung, beschreibung, region, email) {
    try {
        const result = await pool.query(
            `UPDATE app_user SET
            profilname = $1::text,
            kurzbeschreibung = $2::text,
            beschreibung = $3::text,
            region = $4::text
            WHERE email = $5::text
            RETURNING bildid`,
            [profilname, kurzbeschreibung, beschreibung, region, email]
        )
        console.log(`app_user UPDATED`)
        
        if (result.rows[0]['bildid'] == undefined && profilbild != undefined) { // create new profilbild for user
            const newBild = await createQueries.createBild(profilbild)
            if (!newBild.success) throw new Error(newBild.error)
            
            await pool.query(
                `UPDATE app_user SET bildid = $1::int WHERE email = $2::text`,
                [newBild.id, email]
            )
        } else {
            await updateBild(result.rows[0]['bildid'], profilbild)
        }

        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(`COULDN'T UPDATE app_user`,err)
        return {
            success: false,
            error: err
        }
    }
}

async function updatePartyBilder(userid, partybilder) {
    DeleteQueries.deletePartybilderById(userid)

    for (let bild of partybilder) {
        const bildid = await CreateQueries.createBild(bild)

        if (bildid.success) {
            CreateQueries.createPartybild(userid, bildid.id)
        } else {
            console.warn("FAILED TO SAFE ONE bild!")
        }
    }
}

// -------------------- PUBLIC -------------------- //

/**
 * Updates the enduser.
 * @param {string} profilname 
 * @param {string} profilbild 
 * @param {string} kurzbeschreibung 
 * @param {string} beschreibung 
 * @param {string} region 
 * @param {!string} email - must be given, used as reference
 * @param {int} alter 
 * @param {string} arten 
 * @param {string} lied 
 * @param {string} gericht 
 * @param {string} geschlecht 
 * @param {string[]} partybilder
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - the error if one occured
 */
async function updateEndnutzer(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, alter, arten, lied, gericht, geschlecht, partybilder) {
    const app_userResult = await updateApp_user(profilname, profilbild, kurzbeschreibung, beschreibung, region, email)
    if (!app_userResult.success) { // if failed
        console.error(`CANNOT UPDATE endnutzer BECAUSE UPDATE app_user FAILED`)
        return {
            success: false,
            error: app_userResult.error
        }
    }

    try {
        const result = await pool.query(
            `UPDATE endnutzer SET
            alter = $1::int,
            arten = $2::text,
            lied = $3::text,
            gericht = $4::text,
            geschlecht = $5::text
            WHERE emailfk = $6::text
            RETURNING id`,
            [alter, arten, lied, gericht, geschlecht, email]
        )
        console.log(`endnutzer UPDATED`)

        if (partybilder != undefined) updatePartyBilder(result.rows[0]['id'], partybilder)

        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(`COULDN'T UPDATE endnutzer`,err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Updates the artist.
 * @param {string} profilname 
 * @param {string} profilbild 
 * @param {string} kurzbeschreibung 
 * @param {string} beschreibung 
 * @param {string} region 
 * @param {!string} email - must be given, used as reference
 * @param {!string} preis 
 * @param {string} kategorie 
 * @param {string} erfahrung 
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - an error, if one occured
 */
async function updateArtist(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung) {
    const app_userResult = await updateApp_user(profilname, profilbild, kurzbeschreibung, beschreibung, region, email)
    if (!app_userResult.success) { // if failed
        console.error(`CANNOT UPDATE artist BECAUSE UPDATE app_user FAILED`)
        return {
            success: false,
            error: app_userResult.error
        }
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
            success: true,
            error: null
        }
    } catch (err) {
        console.error(`COULDN'T UPDATE artist`,err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Updates the caterer.
 * @param {string} profilname 
 * @param {string} profilbild 
 * @param {string} kurzbeschreibung 
 * @param {string} beschreibung 
 * @param {string} region 
 * @param {!string} email 
 * @param {!string} preis 
 * @param {string} kategorie 
 * @param {string} erfahrung 
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - an error, if one occured
 */
async function updateCaterer(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, preis, kategorie, erfahrung) {
    const app_userResult = await updateApp_user(profilname, profilbild, kurzbeschreibung, beschreibung, region, email)
    if (!app_userResult.success) { // if failed
        console.error(`CANNOT UPDATE caterer BECAUSE UPDATE app_user FAILED`)
        return {
            success: false,
            error: app_userResult.error
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
            success: true,
            error: null
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
    return {
        success: false,
        error: null
    }
}

/**
 * Updates the dishes.
 * @param {!int} id 
 * @param {string} name 
 * @param {string} beschreibung 
 * @param {string} bild 
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - an error, if one occured
 */
async function updateGericht(id, name, beschreibung, bild) {
    try {
        const result = await pool.query(
            `UPDATE gericht SET
            name = $1::text,
            beschreibung = $2::text
            WHERE id = $3::int
            RETURNING bildid`,
            [name, beschreibung, id]
        )
        console.error("gericht UPDATED")

        if(result.rowCount > 0)
        {
            await updateBild(result.rows[0]["bildid"], bild)
        }
        else
        {
            await createQueries.createBild(bild)
        }
        return {
            success: true,
            error: false
        }
    } catch (err) {
        console.error("FAILED TO UPDATE gericht", err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Updates the songs
 * @param {!int} id 
 * @param {string} name 
 * @param {string} laenge 
 * @param {string} erscheinung 
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - an error, if one occured
 */
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
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error("FAILED TO UPDATE lied", err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Updates the location.
 * @param {!int} locationid 
 * @param {!string} adresse 
 * @param {!string} name 
 * @param {string} beschreibung 
 * @param {!boolean} privat 
 * @param {string} kurzbeschreibung 
 * @param {!string} preis 
 * @param {!boolean} openair 
 * @param {!string} flaeche 
 * @param {string} bild 
 * @param {!int} kapazitaet 
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - an error, if one occured
 */
async function updateLocation(userid, locationid, adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, bild, kapazitaet) {
    try {
        const location = await pool.query(
            `SELECT ownerid FROM location WHERE id = $1::int`,
            [locationid]
        )

        if (location.rowCount > 0 && location.rows[0]['ownerid'] === userid) {
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
                kapazitaet = $9::int
                WHERE id = $10::int
                RETURNING bildid`,
                [adresse, name, beschreibung, privat, kurzbeschreibung, preis, openair, flaeche, kapazitaet, locationid]
            )
            console.log(`location UPDATED`)

            if (result.rowCount > 0)
            {
                await updateBild(result.rows[0]["bildid"], bild)
            }
            else
            {
                await createQueries.createBild(profilbild)
            }

            return {
                success: true,
                error: null
            }
        }
        return {
            success: false,
            error: "Unauthorized"
        }
        
    } catch (err) {
        console.error(`COULDN'T UPDATE location`,err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Updates a password.
 * @param {*} token 
 * @param {!string} oldPassword 
 * @param {!string} newPassword 
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - an error, if one occured 
 */
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
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(`COULDN'T UPDATE password`,err)
        return {
            success: false,
            error: err
        }
    }
}

async function updatePlaylist() {
    console.error("UPDATE PLAYLIST NOT YET IMPLEMENTED")
    return {
        success: false,
        error: null
    }
}

/**
 * Updates a mail.
 * @param {!int} id 
 * @param {boolean} gelesen 
 * @param {boolean} angenommen 
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - an error, if one occured
 */
async function updateMail(userid, id, gelesen, angenommen = null) {
    try {
        const mail = await pool.query(
            `SELECT empfaenger FROM mail WHERE id = $1::int`,
            [id]
        )

        if (mail.rows.length > 0 && mail.rows[0]['empfaenger'] === userid) {
            await pool.query(
                `UPDATE mail SET
                gelesen = $2::boolean,
                angenommen = $3
                WHERE id = $1::int`,
                [id, gelesen, angenommen]
            )
            console.log("UPDATED mail")
            return {
                success: true,
                error: null
            }
        }
        return {
            success: false,
            error: "Unauthorized"
        }
        
    } catch (err) {
        console.error("COULDN'T UPDATE mail", err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Updates a picture in the db.
 * @param {!number} id - the id of the picture
 * @param {string} data - the data that'll replace the old
 * @returns {boolean} true if it was successful, false otherwise
 */
async function updateBild(id, data) {
    try {
        await pool.query(
            `UPDATE bild SET data = $2 WHERE id = $1::int`,
            [id, data]
        )
        console.log("UPDATED bild")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.log("COULDN'T UPDATE bild", err)
        return {
            success: false,
            error: err
        }
    }
}

module.exports = {
    updateArtist, 
    updateCaterer, 
    updateEndnutzer,
    updateEvent,
    updateGericht,
    updateLied,
    updateLocation,
    updatePassword,
    updatePlaylist,
    updateMail
}