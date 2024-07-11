const {Pool} = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    host: 'dpg-cq7i0ubv2p9s73c4ug4g-a.frankfurt-postgres.render.com',
    user: 'test_s02o_user',
    port: 5432,
    password: 'l006nMtPSYnk2Yg73hK3lmnCbypjkl9o',
    database: 'test_s02o',
    max: 20,
    ssl: true,
    connectionTimeoutMillis: 20000,
    idelTimeoutMillis: 10000,
    allowExitOnIdle: false
});

/**
 * Compares a given password with the hashed password on the database.
 * @param {!string} email - the email of the app_user
 * @param {!string} password - the given password
 * @returns {!Object} 
 * - success: [true if successful, false otherwise]
 * - user: the information of the user
 * - error: [the error, if one occured]
 */
async function comparePassword(email, password) {
    try {
        const SH = await pool.query(
            "SELECT p.hash FROM app_user a JOIN password p ON a.password = p.id WHERE email = $1::text",
            [email]
        )

        const isMatch = await bcrypt.compare(password, SH.rows[0]['hash'])

        if (isMatch) {
            console.log('User authenticated!')
            const user = await pool.query(
                "SELECT * FROM app_user WHERE email = $1::text",
                [email]
            )
            return {
                success: true,
                user: user.rows[0],
                error: null
            }
        }
        console.error('Authentication failed.')
        return {
            success: true,
            user: null,
            error: "Wrong password"
        }
    } catch (err) {
        console.error("FAILED TO COMPARE PASSWORDS",err)
        return {
            success: false,
            user: null,
            error: err
        }
    }
}

module.exports = {
    pool, comparePassword
};