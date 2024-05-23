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
async function createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region){
    await pool.query(
        "INSERT INTO app_user (benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region) " + 
        "VALUES ('" + benutzername + "','" + profilname + "','" + email + "','" + password + "','" + profilbild + "','" + kurzbeschreibung + "','" + beschreibung + "','" + region + "')", (err,res) =>{
            if(err)
            {
                console.log(err);
                return false;
            } 
            else 
            {
                console.log("app_user created");
                return true;
            }
    });
}

// public
async function createEndUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, alter, arten, lied, gericht, geschlecht){
   
    // create app_user first
    await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region).then(result =>{
        // create endnutzer afterwards
    pool.query(
        "INSERT INTO endnutzer (emailfk, alter, arten, lied, gericht, geschlecht) " + 
        "VALUES ('" + email + "','" + alter + "','" + arten + "','" + lied + "','" + gericht + "','" + geschlecht + "')", (err,res) =>{
        if(err)
        {
            console.log(err);
            return false;
        } 
        else 
        {
            console.log("enduser created");
            return true;
        }
    });
    })
    
}

// public
async function createArtist(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region);
    // create artist afterwards
    await pool.query(
        "INSERT INTO artist (emailfk, preis, kategorie, erfahrung) " + 
        "VALUES ('" + email + "','" + preis + "','" + kategorie + "','" + erfahrung + "')", (err,res) =>{
            if(err)
                {
                    console.log(err);
                    return false;
                } 
                else 
                {
                    console.log("artist created");
                    return true;
                }
    });
}

// public
async function createCaterer(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region, preis, kategorie, erfahrung){
    // create app_user first
    await createAppUser(benutzername, profilname, email, password, profilbild, kurzbeschreibung, beschreibung, region);
    // create caterer afterwards
    await pool.query(
        "INSERT INTO caterer (emailfk, preis, kategorie, erfahrung) " + 
        "VALUES ('" + email + "','" + preis + "','" + kategorie + "','" + erfahrung + "')", (err,res) =>{
            if(err)
                {
                    console.log(err);
                    return false;
                } 
                else 
                {
                    console.log("caterer created");
                    return true;
                }
    });
}

// public
async function createLocation(addresse, name, beschreibung, ownerID, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche){
    await pool.query(
        "INSERT INTO location (addresse, name, beschreibung, ownerid, privat, kurzbeschreibung, preis, kapazitaet, openair, flaeche) " + 
        "VALUES ('" + addresse + "','" + name + "','" + beschreibung + "','" + ownerID + "','" + privat + "','" + kurzbeschreibung + "','" + preis + "','" + kapazitaet + "','" + openair + "','" + flaeche + "')", (err,res) =>{
            if(err)
                {
                    console.log(err);
                    return false;
                } 
                else 
                {
                    console.log("location created");
                    return true;
                }
    });
}

// public
async function createReviewEvent(inhalt, sterne, ownerid, eventid){
    await pool.query(
        "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
        "VALUES ('" + inhalt + "','" + sterne + "','" + ownerid + "','" + eventid + "','" + null + "','"  + null + "')", (err,res) =>{
            if(err)
                {
                    console.log(err);
                    return false;
                } 
                else 
                {
                    console.log("review for event created");
                    return true;
                }
    });
}

// public
async function createReviewUser(inhalt, sterne, ownerid, userid){
    await pool.query(
        "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
        "VALUES ('" + inhalt + "','" + sterne + "','" + ownerid + "','" + null + "','" + userid + "','" + null + "')", (err,res) =>{
            if(err)
                {
                    console.log(err);
                    return false;
                } 
                else 
                {
                    console.log("review for user created");
                    return true;
                }
    });
}

// public
async function createReviewLocation(inhalt, sterne, ownerid, locationid){
    await pool.query(
        "INSERT INTO review (inhalt, sterne, ownerid, eventid, userid, locationid) " + 
        "VALUES ('" + inhalt + "','" + sterne + "','" + ownerid + "','" + null + "','" + null + "','" + locationid + "')", (err,res) =>{
            if(err)
                {
                    console.log(err);
                    return false;
                } 
                else 
                {
                    console.log("review for location created");
                    return true;
                }
    });
}

// public
async function createEvent(name, datum, uhrzeit, eventgroesse, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid){
    await pool.query(
        "INSERT INTO event (name, datum, uhrzeit, eventgroesse, freietickets, preis, altersfreigabe, privat, kurzbeschreibung, beschreibung, bild, ownerid, locationid) " + 
        "VALUES ('" + name + "','" + datum + "','" + uhrzeit + "','" + eventgroesse + "','" + eventgroesse + "','" + preis + "','" + altersfreigabe +
        "','" + privat + "','" + kurzbeschreibung + "','" + beschreibung + "','" + bild + "','" + ownerid + "','" + locationid + "')", (err,res) =>{
            if(err)
                {
                    console.log(err);
                    return false;
                } 
                else 
                {
                    console.log("event created");
                    return true;
                }
    });
}

// public 
async function createServiceArtist(eventid, artistid){
    await pool.query(
        "INSERT INTO serviceartist (eventid, artistid) " + 
        "VALUES ('" + eventid + "','" + artistid + "')", (err,res) =>{
            if(err)
                {
                    console.log(err);
                    return false;
                } 
                else 
                {
                    console.log("serviceartist created");
                    return true;
                }
    });
}

// public
async function createLied(id,ownerid,name,laenge,erscheinung){
    const serchString = "INSERT INTO lied (id,ownerid,name,laenge,erscheinung) VALUES ('"+id+"','"+ownerid+"','"+name+"','"+laenge+"','"+erscheinung+"')"
    await pool.query(serchString, (err,res=>{
        if(err)
            {
                console.log(err);
                return false;
            } 
            else 
            {
                console.log("lied created");
                return true;
            }
    }))
}

// public
async function createGericht(id,ownerid=null,name,beschreibung,bild=null){
    const serchString = "INSERT INTO gericht (id,ownerid,name,beschreibung,bild) VALUES ('"+id+"','"+ownerid+"','"+name+"','"+beschreibung+"','"+bild+"')"
    await pool.query(serchString, (err,res=>{
        if(err)
            {
                console.log(err);
                return false;
            } 
            else 
            {
                console.log("gericht created");
                return true;
            }
    }))
}

// public
async function createPlaylist(id,name,artistid){
    const serchString = "INSERT INTO playlist (id,name,artistid) VALUES ('"+id+"','"+name+"','"+artistid+"')"
    await pool.query(serchString, (err,res=>{
        if(err)
            {
                console.log(err);
                return false;
            } 
            else 
            {
                console.log("playlist created");
                return true;
            }
    }))
}

// public
async function createPlaylistInhalt(playlistid,liedid,id){
    const serchString = "INSERT INTO playlistinhalt (id,playlistid,liedid) VALUES ('"+id+"','"+playlistid+"','"+liedid+"')"
    await pool.query(serchString, (err,res=>{
        if(err)
            {
                console.log(err);
                return false;
            } 
            else 
            {
                console.log("playlistinhalt created");
                return true;
            }
    }))
}

// public
async function createTicket(userid,eventid,id){
    const serchString = "INSERT INTO tickets (id,userid,eventid) VALUES ('"+id+"','"+userid+"','"+eventid+"')"
    await pool.query(serchString, (err,res=>{
        if(err)
            {
                console.log(err);
                return false;
            } 
            else 
            {
                console.log("ticket created");
                return true;
            }
    }))
}

// ------------------------- GET - QUERIES ------------------------- //

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

async function searchEvent(req,res){
    let searchString = "SELECT e.* FROM event e";
    let fileterOptions="";
    let isOpenair =0;
    for(let name in req.body)
    {
        if(!req.body[name]==""){
            if(name.localeCompare("search")==0)
            {
                fileterOptions+= " UPPER(e.name) LIKE UPPER('%" + req.body[name] + "%')";
            }
            else if(name.localeCompare("openair")==0)
            {
                isOpenair = 1
                fileterOptions+= " JOIN location l ON e.locationid = l.id WHERE l.openair = "+req.body[name] ;
            }            
            else
            {
                if(Array.isArray(req.body[name]))
                {
                    if(req.body[name][0]=="")
                        {
                            req.body[name][0]=0
                            if(req.body[name][1]=="")
                            {
                                continue;
                            }
                        }
                    if(req.body[name][1]=="")
                    {
                        req.body[name][1]=0;
                    }
                    fileterOptions+= " e."+name + " BETWEEN '"+ req.body[name][0] + "' AND '" + req.body[name][1]+"'";
                }
                else
                {
                    fileterOptions+= " e."+name + " = '" + req.body[name] + "'";
                }
                
            }
            fileterOptions += " AND"
        }
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
    createEndUser, createArtist, createCaterer, createEvent, createLocation, createReviewEvent, createReviewUser, createReviewLocation, createServiceArtist, createLied, createGericht, createPlaylist, createPlaylistInhalt, createTicket,
    getUserById, getUserByEmail, searchEvent
};


