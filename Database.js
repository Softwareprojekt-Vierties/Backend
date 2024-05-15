const {Client} = require('pg');

const client = new Client({
    host: 'dpg-cp2a9l6n7f5s73fe0sv0-a.frankfurt-postgres.render.com',
    user: 'eventuredb_user',
    port: 5432,
    password: 'mkzjH3FLbXfVtZwtEwJxcxyvAkt8wUuk',
    database: 'eventuredb',
    ssl: true
})

client.connect();

client.query('SELECT * FROM user', (err, res)=>{
    if(err)
    {
        console.log(err.stack)
    }
    else
    {
        console.log(res.rows)
    }
    client.end();
});