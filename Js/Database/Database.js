const {Pool} = require('pg');
const bcrypt = require('bcrypt');

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

async function comparePassword(email, password) {
    try {
        const SH = await pool.query(
            "SELECT p.salt, p.hash FROM app_user a JOIN password p ON a.password = p.id WHERE email = $1::text",
            [email]
        )

        const isMatch = await bcrypt.compare(password, SH.rows[0]['hash'])

        if (isMatch) {
            console.log('User authenticated!')
            const user = await pool.query(
                "SELECT * FROM app_user WHERE email = $1::text",
                [email]
            )
            return user.rows[0]
        }
        console.error('Authentication failed.')
        return null
    } catch (err) {
        console.error(err)
        return null
    }
}

module.exports = {
    pool, comparePassword
};