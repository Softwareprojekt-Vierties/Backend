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
        const salt = await bcrypt.genSalt(10)
        console.log("BEFORE HASHING:", password, "salt:", salt)
        const hash = await bcrypt.hash(String(password), salt)
        passwordID = await pool.query(
            `INSERT INTO password (hash) VALUES ($1) RETURNING id`,
            [hash]
        ).then(res => {return res.rows[0]})

        if (passwordID === undefined) throw new Error("COULDN'T SAVE PASSWORD ON THE DATABASE!")

        const picture = await createBild(profilbild)

        if (!picture.success) throw new Error("COULDN'T SAVE PICTURE ON THE DATABASE!")
        
        // then create the app_user
        const app_user = await pool.query(
            `INSERT INTO app_user (benutzername, profilname, email, password, bildid, kurzbeschreibung, beschreibung, region) 
            VALUES ($1::text, $2::text, $3::text, $4::integer, $5::integer, $6::text, $7::text, $8::text) RETURNING id`,
            [benutzername, profilname, email, passwordID['id'], picture.id, kurzbeschreibung, beschreibung, region])
        console.log("app_user CREATED")
        return {
            success: true,
            id: app_user.rows[0]['id'],
            error: null
        }
    } catch (err) {
        // delete the password if creation of app_user failed
        if (passwordID != undefined) await DeleteQueries.deletePasswordById(passwordID['id'])
        console.error("FAILED TO CREATE app_user",err)
        return {
            success: false,
            id: null,
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
 * @param {string[]} partybilder 
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createEndUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, partybilder){
    // create app_user first
    const app_user = await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region)

    if (!app_user.success) return {
        success: false,
        error: app_user.error
    }

    // create enduser afterwards
    try {
        await pool.query(
            "INSERT INTO endnutzer (emailfk, alter, arten, lied, gericht) VALUES ($1::text, $2::int, $3::text, $4::text, $5::text)",
            [email, alter, arten, lied, gericht]
        )
        console.log("enduser CREATED")

        if (partybilder != undefined) {
            for(let partybild of partybilder) {
                const bildid = await createBild(partybild)
                if (bildid.success) {
                    await createPartybild(app_user.id, bildid.id)
                } else {
                    console.warn("FAILED TO SAFE ONE bild!")
                }
            }
        }

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
            "VALUES ($1::text, $2, $3::text, $4::text) RETURNING id",
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
            "VALUES ($1::text, $2, $3::text, $4::text) RETURNING id",
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
        const picture = await createBild(bild)

        if (!picture.success) throw new Error("COULDN'T SAVE PICTURE ON THE DATABASE!")
        
        const location = await pool.query(
            `INSERT INTO location (adresse, name, beschreibung, ownerid, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche, bildid)
            VALUES ($1::text, $2::text, $3::text, $4::int, $5::bool, $6::text, $7, $8::int, $9::bool, $10::text, $11::integer) RETURNING id`,
            [adresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche, picture.id]
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

        switch (intention)
        {
            case 'event':
                query = "INSERT INTO review (inhalt, sterne, ownerid, eventid) VALUES ($1::text,$2::int,$3::int,$4::int)"
                break
            case 'location':
                query = "INSERT INTO review (inhalt, sterne, ownerid, locationid) VALUES ($1::text,$2::int,$3::int,$4::int)"
                break
            case 'user':
                query = "INSERT INTO review (inhalt, sterne, ownerid, userid) VALUES ($1::text,$2::int,$3::int,$4::int)"
                break
            default:
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
async function createEvent(name, datum, startuhrzeit,enduhrzeit, eventgroesse, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid,serviceProviders){
    const picture = await createBild(bild)

    try {
        if (!picture.success) throw new Error("COULDN'T SAVE PICTURE ON THE DATABASE!")
        
        const event = await pool.query(
            `INSERT INTO event (name, datum, startuhrzeit, enduhrzeit , eventgroesse, freietickets, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bildid, ownerid, locationid,maxtickets)
            VALUES ($1::text, $2, $3, $4 ,$5::int, $6::int, $7, $8::int, $9::boolean, $10::text, $11::text, $12::integer, $13::int, $14::int,$15) RETURNING id`,
            [name,datum,startuhrzeit,enduhrzeit,eventgroesse,eventgroesse,preis,altersfreigabe,privat,kurzbeschreibung,beschreibung,picture.id,ownerid,locationid,eventgroesse]
        )
        console.log("event CREATED")

        for (let provider of serviceProviders){
            if (provider['type'] === 'artist'){
               await createServiceArtist(event.rows[0]["id"],provider["id"])
            }
            else if (provider['type'] === 'caterer')
            {
                await createServiceCaterer(event.rows[0]["id"],provider["id"])
            }
        }

        // // Send mail to providers
        // let providerInfos = ""
        // for (let provider of serviceProviders) {
        //     if (provider['type'] === 'artist') {
        //         const app_userIdOfArtist = await pool.query(
        //             `SELECT a.id FROM app_user a
        //             JOIN artist ar ON a.email = ar.emailfk
        //             WHERE ar.id = $1::int`,
        //             [provider['id']]
        //         )
        //         const service = await createMail(ownerid, app_userIdOfArtist.rows[0]['id'], 'service', event.rows[0]['id'])
        //         service.success ? providerInfos.concat(`Send email to artist ${provider['id']}: true\n`) : providerInfos.concat(`Send email to ${provider['id']}: false ==> ${service.error}\n`)
        //     } else if (provider['type'] === 'caterer') {
        //         const app_userIdOfCaterer = await pool.query(
        //             `SELECT a.id FROM app_user a
        //             JOIN caterer ca ON a.email = ca.emailfk
        //             WHERE ca.id = $1::int`,
        //             [provider['id']]
        //         )
        //         const service = await createMail(ownerid, app_userIdOfCaterer.rows[0]['id'], 'service', event.rows[0]['id'])
        //         service.success ? providerInfos.concat(`Send email to caterer ${provider['id']}: true\n`) : providerInfos.concat(`Send email to ${provider['id']}: false ==> ${service.error}\n`)
        //     } else {
        //         providerInfos.concat(`Invalid provider type '${provider['type']}' for id '${provider['id']}'\n`)
        //     }
        // }

        let providerInfos = ""
        const app_userIdOfLocationOwner = await pool.query(
            `SELECT ownerid FROM location WHERE id = $1::int`,
            [locationid]
        )
        if (app_userIdOfLocationOwner.rows[0]['ownerid'] !== null) {
            const service = await createMail(ownerid, app_userIdOfLocationOwner.rows[0]['ownerid'], 'location', event.rows[0]['id'])
            service.success ? providerInfos.concat(`Send email to location owner ${app_userIdOfLocationOwner.rows[0]['ownerid']}: true\n`) : providerInfos.concat(`Send email to ${app_userIdOfLocationOwner.rows[0]['ownerid']}: false ==> ${service.error}\n`)
        } else providerInfos.concat(`Location is not owned by anybody! Considers this as location accepted!\n`)

        // // inform friends, that an event has been created
        // const friends = await pool.query(`SELECT user2 AS friendid FROM friend WHERE user1 = $1::int`,[ownerid])
        // for (let friend of friends.rows) {
        //     await createMail(ownerid, friend['friendid'], 'info', event.rows[0]['id'])
        // }

        return {
            success: true,
            id: event.rows[0],
            providerInfo: providerInfos,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE AN event",err)
        // delete picture ->  don't fill the DB with deprecated data!
        if (picture.success) DeleteQueries.deleteBildById(picture.id)
        return {
            success: false,
            id: null,
            providerInfo: null,
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
    console.log(eventid,artistid)
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
        const picture = await createBild(bild)

        if (!picture.success) throw new Error("COULDN'T SAVE PICTURE ON THE DATABASE!")

        await pool.query(
            "INSERT INTO gericht (ownerid,name,beschreibung,bildid) VALUES ($1, $2::text, $3::text, $4::integer)",
            [ownerid, name, beschreibung, picture.id]
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
 * Creates a ticket on the database.
 * @param {!number} userid 
 * @param {!number} eventid 
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createTicket(userid,eventid){

    const event = await pool.query(
        `SELECT freietickets FROM event
        WHERE id = $1`,[eventid])
    if(event.rows[0]["freietickets"]<=0)
    {
        console.error("NO TICKETS AVAILEBIL")
        return {
            success: false,
            id: null,
            error: null
            
        }
    }

    const hasTicket = await pool.query(
        `SELECT COUNT(id) FROM tickets
        WHERE userid = $1
        AND eventid = $2`,[userid,eventid])

    if(hasTicket.rows[0]["count"]>0)
    {
        console.error("YOU ALLREADY PURCHEST A TICKET")
        return {
            success: false,
            id: null,
            error: null
            
        }
    }

    const data = generateRandomString(userid,eventid,30)
    

    try {
        const ticketid = await pool.query(
            "INSERT INTO tickets (userid,eventid,data) VALUES ($1::int, $2::int,$3::text) RETURNING id",
            [userid, eventid, data]
        )
        console.log("ticked CREATED")
        console.log(ticketid.rows[0]["id"])        
        return {
            success: true,
            id: ticketid.rows[0]["id"],
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE ticket",err)
        return {
            success: false,
            id: null,
            error: err
            
        }
    }
}

/**
 * Creates a mail on the database.
 * @param {!number} sender - the app_user id of the sender
 * @param {!number} empfaenger - the app_user id of the reciever
 * @param {!string} anfrage - must be one of [location, service, freundschaft, info]
 * @param {number} eventid - the event id if anfrage is [location, service, info], standard null
 * @returns {!Object}  
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */
async function createMail(sender, empfaenger, anfrage, eventid = null,ticketid=null) {
    try {
        let sqlQuery, params

        if (anfrage === 'location' || anfrage === 'service' || anfrage === 'info') {
            if (eventid == null) throw new Error('Cannot create mail for location or service without eventid')
            sqlQuery = `INSERT INTO mail (sender, empfaenger, anfrage, eventid) VALUES ($1::int, $2::int, $3::text, $4::int)`
            params = [sender, empfaenger, anfrage, eventid]
        } else if (anfrage === 'freundschaft') {
            sqlQuery = `INSERT INTO mail (sender, empfaenger, anfrage) VALUES ($1::int, $2::int, $3::text)`
            params = [sender, empfaenger, anfrage]
        } else if (anfrage === 'ticket') {
            sqlQuery = `INSERT INTO mail (sender, empfaenger, anfrage, eventid, ticketid) VALUES ($1::int, $2::int, $3::text,$4,$5)`
            params = [sender, empfaenger, anfrage,eventid,ticketid]
        }else {
            throw new Error(`The given anfrage is not allowed: [location, service, freundschaft], given ${anfrage}`)
        }

        await pool.query(sqlQuery, params)
        console.log("mail CREATED")
        return {
            success: true,
            error: null
        }
    } catch(err) {
        console.error("FAILED TO CREATE mail", err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Inserts a picture into the database.
 * @param {string} data the picture, can be null
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - id: [id of the picture, null if error occured]
 * - error: [the error, if one occured]
 */
async function createBild(data) {
    try {
        const bild = await pool.query(
            `INSERT INTO bild (data) VALUES ($1::text) RETURNING id`,
            [data]
        )
        console.log("bild CREATED")
        return {
            success: true,
            id: bild.rows[0]["id"],
            error: null
        }
    } catch (err) {
        console.error("FAILED TO CREATE bild", err)
        return {
            success: false,
            id: null,
            error: err
        }
    }
}

/**
 * Inserts a new Partypicture into the database.
 * @param {!Number} userid the ID form the user wiche the picture belongs too
 * @param {!Number} bildid the ID of the Picture that should be added to the partybilder tabel
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */

async function createPartybild(userid, bildid) {
    try {
        const partybild = await pool.query(
            `INSERT INTO partybilder (userid, bildid) VALUES ($1::integer, $2::integer)`,
            [userid, bildid]
        )
        console.log("partybild CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Inserts a new Friend into the database Tabel friend.
 * @param {!Number} userid the ID of one of the Useres
 * @param {!Number} friendid the ID of the ohter User
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */

async function createFriend(userid,friendid){
    try {
        await pool.query(
            `INSERT INTO friend (user1, user2) VALUES ($1::integer, $2::integer)`,
            [userid, friendid]
        )
        await pool.query(
            `INSERT INTO friend (user1, user2) VALUES ($1::integer, $2::integer)`,
            [friendid, userid]
        )

        console.log("FRIEND CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Inserts a new Favorit Event into the database Tabel favorit_event.
 * @param {!Number} userid the ID of the User
 * @param {!Number} eventid the ID of the Event
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */

async function createFavoritEvent(userid,eventid){
    try {
        const favorit = await pool.query(
            `INSERT INTO favorit_event (userid, eventid) VALUES ($1::integer, $2::integer)`,
            [userid, eventid]
        )
        console.log("FAVORIT CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Inserts a new Favorit Location into the database Tabel favorit_location.
 * @param {!Number} userid the ID of the User
 * @param {!Number} locationid the ID of the location
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */

async function createFavoritLocation(userid,locationid){
    try {
        const favorit = await pool.query(
            `INSERT INTO favorit_location (userid, locationid) VALUES ($1::integer, $2::integer)`,
            [userid, locationid]
        )
        console.log("FAVORIT CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Inserts a new Favorit Enduser into the database Tabel favorit_user.
 * @param {!Number} userid the ID of the User
 * @param {!Number} enduserid the ID of the Enduser
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */

async function createFavoritEndUser(userid,enduserid){
    try {
        const favorit = await pool.query(
            `INSERT INTO favorit_user (userid, enduserid) VALUES ($1::integer, $2::integer)`,
            [userid, enduserid]
        )
        console.log("FAVORIT CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Inserts a new Favorit Artist into the database Tabel favorit_user.
 * @param {!Number} userid the ID of the User
 * @param {!Number} artistid the ID of the Artist
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */

async function createFavoritArtist(userid,artistid){
    try {
        const favorit = await pool.query(
            `INSERT INTO favorit_user (userid, artistid) VALUES ($1::integer, $2::integer)`,
            [userid, artistid]
        )
        console.log("FAVORIT CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Inserts a new Favorit Caterer into the database Tabel favorit_user.
 * @param {!Number} userid the ID of the User
 * @param {!Number} catereid the ID of the Caterer
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */

async function createFavoritCaterer(userid,catereid){
    try {
        const favorit = await pool.query(
            `INSERT INTO favorit_user (userid, catereid) VALUES ($1::integer, $2::integer)`,
            [userid, catereid]
        )
        console.log("FAVORIT CREATED")
        return {
            success: true,
            error: null
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: err
        }
    }
}

/**
 * Inserts new Mails for the ServiceCaterer and ServiceArtist.
 * @param {!Number} eventid the ID of the Event
 * @param {!Number} ownerid the ID of the Event owner
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - error: [the error, if one occured]
 */

async function sendEventMail(eventid,ownerid)
{
    try
    {
        const serviceartist = await pool.query(
            `SELECT * FROM serviceartist
            WHERE eventid = $1
            `,
            [eventid]
        )

        const servicecaterer = await pool.query(
            `SELECT * FROM servicecaterer
            WHERE eventid = $1
            `,
            [eventid]
        )


        // Send mail to providers
        let providerInfos = ""
        for (let provider of serviceartist.rows) {
            let app_userIdOfArtist = await pool.query(
                `SELECT a.id FROM app_user a
                JOIN artist ar ON a.email = ar.emailfk
                WHERE ar.id = $1::int`,
                [provider['artistid']]
            )
            const service = await createMail(ownerid, app_userIdOfArtist.rows[0]['id'], 'service', eventid)
            service.success ? providerInfos.concat(`Send email to artist ${provider['id']}: true\n`) : providerInfos.concat(`Send email to ${provider['id']}: false ==> ${service.error}\n`)
            
        }
        for (let provider of servicecaterer.rows) {
        
            let app_userIdOfCaterer = await pool.query(
                `SELECT a.id FROM app_user a
                JOIN caterer ca ON a.email = ca.emailfk
                WHERE ca.id = $1::int`,
                [provider['catererid']]
            )
            console.log("artist: "+ app_userIdOfCaterer)
            const service = await createMail(ownerid, app_userIdOfCaterer.rows[0]['id'], 'service', eventid)
            service.success ? providerInfos.concat(`Send email to caterer ${provider['id']}: true\n`) : providerInfos.concat(`Send email to ${provider['id']}: false ==> ${service.error}\n`)
            
        }

        const friends = await pool.query(`SELECT user2 AS friendid FROM friend WHERE user1 = $1::int`,[ownerid])
        for (let friend of friends.rows) {
            await createMail(ownerid, friend['friendid'], 'info',eventid)
        }

        return{
            success : true,
            error : null
        }
    }
    catch(err)
    {
        console.log(err)
        return{
            success : false,
            error : err
        }
    }
}

//-----------------private--------------------------
// Funktion zur Erzeugung einer Pseudo-Zufallszahl mit Seed
function seededRandom(seed1, seed2) {
    var seed = seed1 * seed2
    var modulus = 2 ** 32;
    var a = 1664525;
    var c = 1013904223;
    seed = (a * seed + c) % modulus;
    return seed / modulus;
}

// Funktion zur Erzeugung eines zufälligen Strings
function generateRandomString(seed1, seed2, length) {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    var randomString = '';

    for (var i = 0; i < length; i++) {
        var randomValue = seededRandom(seed1, seed2);
        var randomIndex = Math.floor(randomValue * charactersLength);
        randomString += characters.charAt(randomIndex);
        seed1 = (seed1 + 1) % 10000;  // Update the seed to ensure more randomness
        seed2 = (seed2 + 1) % 10000;  // Update the seed to ensure more randomness
    }

    return randomString;
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
    createMail,
    createGericht,
    createTicket,
    createBild,
    createPartybild,
    createFriend,
    createFavoritEvent,
    createFavoritLocation,
    createFavoritEndUser,
    createFavoritArtist,
    createFavoritCaterer,
    sendEventMail
}