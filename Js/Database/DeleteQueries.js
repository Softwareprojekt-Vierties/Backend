const { pool } = require('./Database.js')

/**
* Deletes a ticket from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'id' - deletes a SINGLE ticket based on the id
* - 'ownerid' - deletes ALL ticket based on that the id is from an owner
* - 'eventid' - deletes ALL ticket based on that the id is from an event
* - anything else will result in a fail
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteTicketsById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE tickets OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('id')) {
            query = `DELETE FROM tickets WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('ownerid')) {
            query = `DELETE FROM tickets WHERE ownerid = $1::int RETURNING *`
        } else if (deleteBy.matchAll('eventid')) {
            query = `DELETE FROM tickets WHERE eventid = $1::int RETURNING *`
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

/**
* Deletes servicecaterer from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'id' - deletes a SINGLE servicecaterer based on the id
* - 'catererid' - deletes ALL servicecaterer based on that the id is from a caterer
* - 'eventid' - deletes ALL servicecaterer based on that the id is from an event
* - anything else will result in a fail
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteServiceCatererById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE servicecaterer OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('id')) {
            query = `DELETE FROM servicecaterer WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('catererid')) {
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
* - 'id' - deletes a SINGLE serviceartist based on the id
* - 'artistid' - deletes ALL serviceartist based on that the id is from an artist
* - 'eventid' - deletes ALL serviceartist based on that the id is from an event
* - anything else will result in a fail
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteServiceArtistById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE serviceartist OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('id')) {
            query = `DELETE FROM serviceartist WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('artistid')) {
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
* - 'id' - deletes a SINGLE review based on the id
* - 'ownerid' - deletes ALL review based on that the id is from the owner
* - 'eventid' - deletes ALL review based on that the id is from an event
* - 'userid' - deletes ALL review based on that the id is from a user
* - 'locationid' - deletes ALL review based on that the id is from a location
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteReviewById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE A review OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('id')) {
            query = `DELETE FROM review WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('ownerid')) {
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

/**
* Deletes playlistinhalt from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'playlistid' - deletes ALL playlistinhalt based on that the id is from a playlist
* - 'liedid' - deletes ALL playlistinhalt based on that the id is from a lied
* - 'id' - deletes a SINGLE playlistinhalt based on the id
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deletePlaylistInhaltById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE A playlistinhalt OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('playlistid')) {
            query = `DELETE FROM playlistinhalt WHERE playlistid = $1::int RETURNING *`
        } else if (deleteBy.matchAll('liedid')) {
            query = `DELETE FROM playlistinhalt WHERE liedid = $1::int RETURNING *`
        } else if (deleteBy.matchAll('id')) {
            query = `DELETE FROM playlistinhalt WHERE id = $1::int RETURNING *`
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
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A playlistinhalt", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes a playlist from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {number} deleteBy - the origin of the id, should be one of the following:
*
* - 'playlistid' - deletes a SINGLE playlist based on the id
* - 'artistid' - deletes ALL playlist based on that the id is from the artist
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deletePlaylistById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE A playlist OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('locationid')) {
            query = `DELETE FROM playlist WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('ownerid')) {
            query = `DELETE FROM playlist WHERE artistid = $1::int RETURNING *`
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
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A playlist", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes a passwort from the DB using an id.
*
* @param {number} id - the id of the password, dictates what should be deleted
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deletePasswordById(id) {
    try {
        console.warn("TRYING TO DELETE A password OF", id)
        let query = `DELETE FROM playlist WHERE id = $1::int RETURNING *`

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
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A password", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes a location from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'locationid' - deletes a SINGLE location based on the id
* - 'ownerid' - deletes ALL location based on that the id is from an owner
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteLocationById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE A location OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('locationid')) {
            query = `DELETE FROM location WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('ownerid')) {
            query = `DELETE FROM location WHERE ownerid = $1::int RETURNING *`
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
            // delete pictures
            for (let i = 0; i < result.rows.length; i++) {
                await deleteBildById(result.rows[i]['bildid'])
            }

            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A location", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes a lied from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'liedid' - deletes a SINGLE lied based on the id
* - 'ownerid' - deletes ALL lied based on that the id is from an owner
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteLiedById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE A lied OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('liedid')) {
            query = `DELETE FROM lied WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('ownerid')) {
            query = `DELETE FROM lied WHERE ownerid = $1::int RETURNING *`
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
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A lied", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes a gericht from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'gerichtid' - deletes a SINGLE gericht based on the id
* - 'ownerid' - deletes ALL gericht based on that the id is from an owner
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteGerichtById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE A gericht OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('gerichtid')) {
            query = `DELETE FROM gericht WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('ownerid')) {
            query = `DELETE FROM gericht WHERE ownerid = $1::int RETURNING *`
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
            // delete pictures
            for (let i = 0; i < result.rows.length; i++) {
                await deleteBildById(result.rows[i]['bildid'])
            }

            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A gericht", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes an event from the DB using an id.
*
* @param {number} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'eventid' - deletes a SINGLE event based on the id
* - 'ownerid' - deletes ALL event based on that the id is from an owner
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteEventById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE AN event OF", id, deleteBy)
        let query

        if (deleteBy.matchAll('eventid')) {
            query = `DELETE FROM event WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('ownerid')) {
            query = `DELETE FROM event WHERE ownerid = $1::int RETURNING *`
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
            // delete pictures
            for (let i = 0; i < result.rows.length; i++) {
                await deleteBildById(result.rows[i]['bildid'])
            }

            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE AN event", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes an app_user from the DB using an id.
*
* @param {any} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'id' - deletes a SINGLE app_user based on the id
* - 'email' - deletes a SINGLE app_user based on the email
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteAppUserById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE AN app_user OF", id)
        let query

        if (deleteBy.matchAll('id')) {
            query = `DELETE FROM endnutzer WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('email')) {
            query = `DELETE FROM endnutzer WHERE email = $1::text RETURNING *`
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
            // delete pictures
            for (let i = 0; i < result.rows.length; i++) {
                await deleteBildById(result.rows[i]['bildid'])
            }

            return {
                sucess: true,
                data: result.rows
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE AN app_user", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes an endnutzer from the DB using an id.
*
* @param {any} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'id' - deletes a SINGLE endnutzer based on the id
* - 'email' - deletes a SINGLE endnutzer based on the email
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteEndnutzerById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE AN endnutzer OF", id)
        let query

        if (deleteBy.matchAll('id')) {
            query = `DELETE FROM endnutzer WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('email')) {
            query = `DELETE FROM endnutzer WHERE emailfk = $1::text RETURNING *`
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
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE AN endnutzer", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes a caterer from the DB using an id.
*
* @param {any} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'id' - deletes a SINGLE caterer based on the id
* - 'email' - deletes a SINGLE caterer based on the email
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteCatererById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE A caterer OF", id)
        let query

        if (deleteBy.matchAll('id')) {
            query = `DELETE FROM caterer WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('email')) {
            query = `DELETE FROM caterer WHERE emailfk = $1::text RETURNING *`
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
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE A caterer", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
* Deletes an artist from the DB using an id.
*
* @param {any} id - the id, dictates what should be deleted
* @param {string} deleteBy - the origin of the id, should be one of the following:
*
* - 'id' - deletes a SINGLE artist based on the id
* - 'email' - deletes a SINGLE artist based on the email
* - anything else will result in a fail
*
* @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
*/
async function deleteArtistById(id, deleteBy) {
    try {
        console.warn("TRYING TO DELETE AN artist OF", id)
        let query

        if (deleteBy.matchAll('id')) {
            query = `DELETE FROM artist WHERE id = $1::int RETURNING *`
        } else if (deleteBy.matchAll('email')) {
            query = `DELETE FROM artist WHERE emailfk = $1::text RETURNING *`
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
        console.error("AN ERROR OCCURRED WHILE TRYING TO DELETE AN artist", err)
        return {
            success: false,
            data: null,
            error: err
        }
    }
}

/**
 * Deletes a bild from the DB using an id.
 * 
 * @param {number} id - the id, dictates what should be deleted
 * @returns {Object} An object containing the following:
*
* - boolean: sucess - If the deletion was successful or not
* - any[]: data - The data returned from the deletion operation, can be null
* - any: error - The error that occoured if something failed, only written if success = false
 */
async function deleteBildById(id) {
    try {
        console.warn("TRYING TO DELETE A bild OF", id)
        const result = await pool.query(
            `DELETE FROM bild WHERE id = %1::int RETURNING *`,
            [id]
        )
        if (result.rows.length === 0) {
            return {
                success: true,
                data: null,
                error: null
            }
        } else {
            return {
                sucess: true,
                data: result.rows,
                error: null
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURED WHILE TRYING TO DELETE A bild", err)
        return {
            sucess: false,
            data: null,
            error: err
        }
    }
}

async function deletePartybilderById(id) {
    try {
        console.warn("TRYING TO DELETE ALL partybilder OF app_user", id)
        const result = await pool.query(
            `DELETE FROM partybilder WHERE userid = $1::int RETURNING *`,
            [id]
        )
        for (let partybild of result['bildid']) {
            await deleteBildById(partybild)
        }
        if (result.rows.length === 0) {
            return {
                success: true,
                data: null,
                error: null
            }
        } else {
            return {
                sucess: true,
                data: result.rows,
                error: null
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURED WHILE TRYING TO DELETE partybilder", err)
        return {
            sucess: false,
            data: null,
            error: err
        }
    }
}

async function deleteFavorites(userid) {
    try {
        await pool.query(
            `DELETE FROM favorit_event WHERE userid = $1::int`,
            [userid]
        )
        await pool.query(
            `DELETE FROM favorit_location WHERE userid = $1::int`,
            [userid]
        )
        await pool.query(
            `DELETE FROM favorit_user WHERE userid = $1::int`,
            [userid]
        )
    } catch(err) {
        console.error("ERROR WHILE TRYING TO DELETE favorites", err)
    }
}

async function deleteFriends(userid) {
    try {
        console.warn("TRYING TO DELETE ALL friends OF app_user", userid)
        await pool.query(
            `DELETE FROM friend WHERE user1 = $1::int OR user2 = $1::int`,
            [userid]
        )
    } catch(err) {
        console.error("AN ERROR OCCURED WHILE TRYING TO DELETE friends", err)
    }
}

async function deleteMails(userid) {
    try {
        console.warn("TRYING TO DELETE ALL mails OF app_user", userid)
        await pool.query(
            `DELETE FROM mail WHERE sender = $1::int OR empfaenger = $1::int`,
            [userid]
        )
    } catch(err) {
        console.error("AN ERROR OCCURED WHILE TRYING TO DELETE mails", err)
    }
}

async function deletefriend(req,res) {
    const friendid = req.params["id"]
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
            `DELETE FROM friend
            WHERE (user1 = $1::int
	            OR user2 = $1::int)
                AND (user1 = $2::int
                OR user2 = $2::int)` ,
            [userid,friendid]
        )
        if (result.rows.length === 0) {
            return {
                success: true,
                data: null,
                error: null
            }
        } else {
            return {
                sucess: true,
                data: result.rows,
                error: null
            }
        }
    } catch (err) {
        console.error("AN ERROR OCCURED WHILE TRYING TO DELETE friend", err)
        return {
            sucess: false,
            data: null,
            error: err
        }
    }
}

module.exports = {
    deleteMails,
    deleteFriends,
    deleteFavorites,
    deleteAppUserById,
    deleteArtistById,
    deleteCatererById,
    deleteEndnutzerById,
    deleteEventById,
    deleteGerichtById,
    deleteLiedById,
    deleteLocationById,
    deletePasswordById,
    deletePlaylistById,
    deletePlaylistInhaltById,
    deleteReviewById,
    deleteServiceArtistById,
    deleteServiceCatererById,
    deleteTicketsById,
    deletePartybilderById,
    deletefriend,
    deleteBildById
}