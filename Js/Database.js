const { response } = require('express');
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
function createLocation(addresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche){
    pool.query(
        "INSERT INTO location (addresse, name, beschreibung, ownerid, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche) " + 
        "VALUES ('" + addresse + "','" + name + "','" + beschreibung + "','" + ownerID + "','" + privat + "','" + kurzbeschreibung + "','" + preis + "','" + kapazitaet + "','" + openair + "','" + flaeche + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("location created");
    });
}

// public
function createReviewEvent(inhalt, sterne, ownerid, eventid){
    pool.query(
        "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
        "VALUES ('" + inhalt + "','" + sterne + "','" + ownerid + "','" + eventid + "','" + null + "','"  + null + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("review for event created");
    });
}

// public
function createReviewUser(inhalt, sterne, ownerid, userid){
    pool.query(
        "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
        "VALUES ('" + inhalt + "','" + sterne + "','" + ownerid + "','" + null + "','" + userid + "','" + null + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("review for user created");
    });
}

// public
function createReviewLocation(inhalt, sterne, ownerid, locationid){
    pool.query(
        "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
        "VALUES ('" + inhalt + "','" + sterne + "','" + ownerid + "','" + null + "','" + null + "','" + locationid + "')", (err,res) =>{
            if(err) console.log(err);
            else console.log("review for location created");
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

// public
function createLied(id,ownerid,name,laenge,erscheinung){
    const serchString = "INSERT INTO lied (id,ownerid,name,laenge,erscheinung) VALUES ('"+id+"','"+ownerid+"','"+name+"','"+laenge+"','"+erscheinung+"')"
    pool.query(serchString, (err,res=>{
        if(err) console.log(err);
        else console.log("lied created");
    }))
}

// public
function createGericht(id,ownerid=null,name,beschreibung,bild=null){
    const serchString = "INSERT INTO gericht (id,ownerid,name,beschreibung,bild) VALUES ('"+id+"','"+ownerid+"','"+name+"','"+beschreibung+"','"+bild+"')"
    pool.query(serchString, (err,res=>{
        if(err) console.log(err);
        else console.log("gericht created");
    }))
}

// public
function createPlaylist(id,name,artistid){
    const serchString = "INSERT INTO playlist (id,name,artistid) VALUES ('"+id+"','"+name+"','"+artistid+"')"
    pool.query(serchString, (err,res=>{
        if(err) console.log(err);
        else console.log("playlist created");
    }))
}

// public
function createPlaylistInhalt(playlistid,liedid,id){
    const serchString = "INSERT INTO playlistinhalt (id,playlistid,liedid) VALUES ('"+id+"','"+playlistid+"','"+liedid+"')"
    pool.query(serchString, (err,res=>{
        if(err) console.log(err);
        else console.log("playlistinhalt created");
    }))
}

// public
function createTicket(userid,eventid,id){
    const serchString = "INSERT INTO tickets (id,userid,eventid) VALUES ('"+id+"','"+userid+"','"+eventid+"')"
    pool.query(serchString, (err,res=>{
        if(err) console.log(err);
        else console.log("ticket created");
    }))
}

// public
function createServiceArtist(id,eventid,artistid){
    const serchString = "INSERT INTO serviceartist (id,eventid,artistid) VALUES ('"+id+"','"+eventid+"','"+artistid+"')"
    pool.query(serchString, (err,res=>{
        if(err) console.log(err);
        else console.log("serviceartist created");
    }))
}

// ------------------------- GET - QUERIES ------------------------- //

async function getStuffbyName(req){
    
    const result = await pool.query("SELECT * FROM "+req.body["tabel"]+" WHERE UPPER(name) LIKE UPPER('%" + req.body["value"] + "%')")
    return result;
}

async function getCatererByName(name){
    const result = await pool.query("SELECT c.*,a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region FROM caterer c JOIN app_user a ON c.emailfk = a.email WHERE UPPER(a.benutzername) LIKE UPPER('%"+name+"%')");
    return result;
}

async function getArtistByName(name){
    const result = await pool.query("SELECT ar.*, a.benutzername, a.profilname,a.profilbild,a.kurzbeschreibung,a.beschreibung,a.region FROM artist ar JOIN app_user a ON ar.emailfk = a.email WHERE UPPER(a.benutzername) LIKE UPPER('%"+name+"%')");
    return result;
}

async function getUserById(id){
    await pool.query('SELECT * FROM app_user WHERE id =' +id, (err,res) =>{
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

async function getAllTicketsFromUser(userId){
    const result = await pool.query("SELECT name FROM event  JOIN tickets ON tickets.eventid = event.id WHERE tickets.userid = '" +userId+"'");
    return result
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

async function getArtistByEvent(id){
    const result = await pool.query("SELECT a.benutzername,a.profilbild FROM app_user a JOIN artist ar  ON ar.emailfk = a.email JOIN serviceartist sa ON sa.artistid = ar.id JOIN event e ON e.id = sa.eventid WHERE sa.eventid = '"+id+"'");
    return result;
}

async function searchEvent(req,res){
    let searchString = "SELECT e.* FROM event e";
    let fileterOptions="";
    let isOpenair =0;
    for(let name in req.body)
    {
    
        if(name.localeCompare("search")==0)
        {
            fileterOptions+= " e.UPPER(name) LIKE UPPER('%" + req.body[name] + "%')";
        }
        if(name.localeCompare("openair")==0)
        {
            isOpenair = 1
            fileterOptions+= " JOIN location l ON e.locationid = l.id WHERE l.openair = "+req.body[name] ;
        }
        
        else
        {
            if(Array.isArray(req.body[name]))
            {
                fileterOptions+= " e."+name + " BETWEEN '"+ req.body[name][0] + "' AND '" + req.body[name][1]+"'";
            }
            else
            {
                fileterOptions+= " e."+name + " = '" + req.body[name] + "'";
            }
            
        }
        fileterOptions += " AND"
    }
    fileterOptions = fileterOptions.substring(0,fileterOptions.length-3)
    if(fileterOptions!=""&&isOpenair==0)
    {
        searchString+= " WHERE" + fileterOptions;
    }
    else if(isOpenair==1)
    {
        searchString+= fileterOptions;
    }

    console.log(searchString)
    const result = await pool.query(searchString)
    res.send(result)   
}

module.exports = {
    createEndUser, createArtist, createCaterer, createEvent, createLocation, createReviewEvent, createReviewUser, createReviewLocation, createServiceArtist, createLied, createGericht, createPlaylist, createPlaylistInhalt, createTicket, createServiceArtist,
    getUserById, getUserByEmail, searchEvent, getStuffbyName, getCatererByName , getArtistByName, getAllTicketsFromUser, getArtistByEvent
};