const { pool } = require('./Database.js')
const bcrypt = require('bcrypt')
const cookieJwtAuth = require('../CookieJwtAuth')

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

async function updateMail(id, gelesen, angenommen = null) {
    try {
        await pool.query(
            `UPDATE mail SET
            gelesen = $2::boolean,
            angenommen = $3
            WHERE id = $1::int`,
            [id, gelesen, angenommen]
        )
        console.log("UPDATED mail")
        return true
    } catch (err) {
        console.error("COULDN'T UPDATE mail", err)
        return false
    }
}

async function updateBild(id, data) {
    try {
        await pool.query(
            `UPDATE bild SET bild = $2 WHERE id = $1::int`,
            [id, bild]
        )
        console.log("UPDATED bild")
        return true
    } catch (err) {
        console.log("COULDN'T UPDATE bild", err)
        return false
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