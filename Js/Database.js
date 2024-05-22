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

async function getUserById(id){
    await pool.query('SELECT * FROM app_user WHERE uuid =' +id, (err,res) =>{
        if(!err)
        {
            console.log(res.rows);
            return res.rows;
        }
        else
        {
            console.log(err);
            return null;
        }
    });
}

async function getUserByEmail(email,pass){
    try {
        const {rows} = await pool.query("SELECT * FROM app_user WHERE email = '" + email + "' AND password = '" + pass + "'");
        return rows[0];
    } catch (err) {
        console.log(err);
        return null;
    }
    
}

// ------------------------- CREATE - QUERIES ------------------------- //

// private
function createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region){
    pool.query(
        "INSERT INTO app_user (benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region) " + 
        "VALUES ('" + benutzername + "','" + profilname == null ? benutzername : profilname + "','" + email + "','" + password + "','" + profilbild + "','" + kurzbeschreibung + "','" + beschreibung + "','" + region + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("app_user created");
    });
}

// public
function createEndUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht){
    // create app_user first
    createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region);
    // create endnutzer afterwards
    pool.query(
        "INSERT INTO endnutzer (emailfk, alter, arten, lied, gericht, geschlecht) " + 
        "VALUES ('" + email + "','" + alter + "','" + arten + "','" + lied + "','" + gericht + "','" + geschlecht + "')", (err,res) =>{
        if(err) console.log(err);
        else console.log("endnutzer created");
    });
}

// public
function createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region);
    // create artist afterwards
    pool.query(
        "INSERT INTO artist (emailfk, preis, kategorie, erfahrung) " + 
        "VALUES ('" + email + "','" + preis + "','" + kategorie + "','" + erfahrung + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("artist created");
    });
}

// public
function createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region);
    // create caterer afterwards
    pool.query(
        "INSERT INTO caterer (emailfk, preis, kategorie, erfahrung) " + 
        "VALUES ('" + email + "','" + preis + "','" + kategorie + "','" + erfahrung + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("caterer created");
    });
}

// public
function createLocation(addresse, name, beschreibung, ownerID, privat){
    pool.query(
        "INSERT INTO location (addresse, name, beschreibung, ownerid, privat) " + 
        "VALUES ('" + addresse + "','" + name + "','" + beschreibung + "','" + ownerID + "','" + privat + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("location created");
    });
}

// public
function createReviewEvent(inhalt, sterne, ownerid, eventid){
    pool.query(
        "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid) " + 
        "VALUES ('" + inhalt + "','" + sterne + "','" + ownerid + "','" + eventid + "','" + null + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("review for event created");
    });
}

// public
function createReviewUser(inhalt, sterne, ownerid, userid){
    pool.query(
        "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid) " + 
        "VALUES ('" + inhalt + "','" + sterne + "','" + ownerid + "','" + null + "','" + userid + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("review for user created");
    });
}

// public
function createEvent(name, datum, uhrzeit, eventgroesse, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid){
    pool.query(
        "INSERT INTO event (name, datum, uhrzeit, eventgroesse, freietickets, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid) " + 
        "VALUES ('" + name + "','" + datum + "','" + uhrzeit + "','" + eventgroesse + "','" + eventgroesse + "','" + preis + "','" + altersfreigabe +
        "','" + privat + "','" + kurzbeschreibung + "','" + beschreibung + "','" + bild + "','" + ownerid + "','" + locationid + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("event created");
    });
}

// public 
function createServiceArtist(eventid, artistid){
    pool.query(
        "INSERT INTO serviceartist (eventid, artistid) " + 
        "VALUES ('" + eventid + "','" + artistid + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("serviceartist created");
    });
}

async function searchEvent(req,res){
    let searchString = "SELECT * FROM EVENT";
    let fileterOptions="";
    for(let name in req.body)
    {
        if(name =="search")
        {
            fileterOptions+= " name LIKE '" + req.body[name] + "'";
        }
        
        else
        {
            if(Array.isArray(req.body[name]))
            {
                fileterOptions+= name + " BETWEEN "+ req.body[name][0] + " AND " + req.body[name][1];
            }
            else
            {
                fileterOptions+= " "+name + " == '" + req.body[name] + "'";
            }
            
        }
        fileterOptions += " AND"
    }
    fileterOptions = fileterOptions.substring(0,fileterOptions.length-3)
    if(fileterOptions!="")
    {
        searchString+= " WHERE" + fileterOptions;
    }

    console.log(searchString)
    const result = await pool.query(searchString)
    res.send(result)   
}

module.exports = {
    createEndUser, createArtist, createCaterer, createEvent, createLocation, createReviewEvent, createReviewUser, createServiceArtist,
    getUserById, getUserByEmail, searchEvent
};


