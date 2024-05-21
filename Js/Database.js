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

function createUser(email,pass,name){
    pool.query("INSERT INTO app_user (email,password,name) VALUES ('"+email+"','"+pass+"','"+name+"')", (err,res) =>{
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log("User created");
        }
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

async function createEvent(req,res)
{
    let createString = "INSERT INTO event";
    let variabels="(";
    let values="(";
    for(let name in req.body)
    {
        variabels+=name+",";
        values+= "'"+req.body[name]+"'";
        values+=",";
    }
    variabels = variabels.substring(0,variabels.length-2)+")";
    variabels = variabels.substring(0,values.length-2)+")";

    createString+=" "+ variabels + " VALUES "+ values;    

    await pool.query(createString);
}




module.exports = {getUserById, getUserByEmail,createUser,searchEvent,createEvent};


