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

module.exports = {getUserById, getUserByEmail};


