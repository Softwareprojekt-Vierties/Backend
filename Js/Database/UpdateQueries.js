const { pool } = require('./Database.js') 
const DeleteQueries = require("./DeleteQueries.js")
const CreateQueries = require("./CreateQueries.js")
const GetQueries = require("./GetQueries.js")
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
            const newBild = await CreateQueries.createBild(profilbild)
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
 * @param {string[]} partybilder
 * @returns {!Object} 
 * - boolean: success - true if successful, false otherwise
 * - Error: error - the error if one occured
 */
async function updateEndnutzer(profilname, profilbild, kurzbeschreibung, beschreibung, region, email, alter, arten, lied, gericht, partybilder) {
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
            gericht = $4::text
            WHERE emailfk = $5::text
            RETURNING id`,
            [alter, arten, lied, gericht, email]
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

        if(result.rows[0]["bildid"]===undefined)
        {
            let bildid = await CreateQueries.createBild(bild)
            await pool.query(
                `UPDATE gericht SET
                bildid = $1
                WHERE id = $2`,
                [bildid,id])
        }
        else
        {
            await updateBild(result.rows[0]["bildid"], bild)
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

            if (result.rows[0]["bildid"]===undefined)
            {
                await updateBild(result.rows[0]["bildid"], bild)
            }
            else
            {
                const id = await CreateQueries.createBild(bild)
                if(!id.success) throw new Error(id.error)
                await pool.query(
                    `UPDATE location SET
                    bildid = $1::int
                    WHERE id = $2::int`,
                    [id.id,locationid]
                )
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
            `SELECT sender, empfaenger, eventid, anfrage FROM mail WHERE id = $1::int`,
            [id]
        )

        if (mail.rows.length > 0 && mail.rows[0]['empfaenger'] === userid) {
            // update mail
            await pool.query(
                `UPDATE mail SET
                gelesen = $2::boolean,
                angenommen = $3
                WHERE id = $1::int`,
                [id, gelesen, angenommen]
            )
            console.log("UPDATED mail")

            // add artist/caterer to the service of the event
            if (mail.rows[0]['anfrage'] === 'service') {
                // get email of the empfaenger
                const app_user = await pool.query(
                    `SELECT email FROM app_user WHERE id = $1::int`,
                    [mail.rows[0]['empfaenger']]
                )
                // find out if the user is an artist or caterer
                const userType = await pool.query(
                    `SELECT id, true AS isArtist
                    FROM artist
                    WHERE emailfk = $1::text

                    UNION ALL

                    SELECT id, false AS isArtist
                    FROM caterer
                    WHERE emailfk = $1::text`,
                    [app_user.rows[0]['email']]
                )
                // add artist or caterer to the event
                // userType.rows[0]['isArtist'] ? 
                //     await CreateQueries.createServiceArtist(mail.rows[0]['eventid'], userType.rows[0]['id']) :
                //     await CreateQueries.createServiceCaterer(mail.rows[0]['eventid'], userType.rows[0]['id'])
                userType.rows[0]['isArtist'] ?
                await eventMailResponse("artist",angenommen, userType.rows[0]['id'],mail.rows[0]['eventid']):
                await eventMailResponse("caterer",angenommen,userType.rows[0]['id'],mail.rows[0]['eventid'])
            } 

            if (mail.rows[0]['anfrage'] === 'location') eventMailResponse("location",angenommen,0,mail.rows[0]['eventid'])
            // add to friends if the user accepted friend request
            else if (mail.rows[0]['anfrage'] === 'freundschaft' && angenommen == true) {
                CreateQueries.createFriend(mail.rows[0]['sender'], mail.rows[0]['empfaenger'])
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
        console.error("COULDN'T UPDATE mail", err)
        console.error("GIVEN:", userid, id, gelesen, angenommen)
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

async function eventMailResponse(type,accepted,objid,eventid)
{
    switch(type){
        case "caterer":
            if(accepted) await pool.query("UPDATE SET servicecaterer accepted = true WHERE eventid = $1 AND catererid = $2",[eventid,objid])
            else if(!accepted) await DeleteQueries.deleteOneServiceCatererById(objid,eventid)
            else break
            return "Caterer Updated"
        case "artist":
            if(accepted) await pool.query("UPDATE serviceartist SET accepted = true WHERE eventid = $1 AND artistid = $2",[eventid,objid])
            else if (!accepted) await DeleteQueries.deleteOneServiceArtistById(objid,eventid)
            else break
            return "Artist Updated"
        case "location":
            if(accepted) await pool.query("UPDATE event SET isvalid = true WHERE eventid = $1 ",[eventid])
            else if ((!accepted) ) await pool.query("UPDATE event SET locationid = null WHERE eventid = $1 ",[eventid])
            else break
            return "Location Updated"

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
    updateMail,
    eventMailResponse
}