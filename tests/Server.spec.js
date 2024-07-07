const request = require("supertest")
const app = require("../Js/Server")
const jwt = require("jsonwebtoken")
const database = require("../Js/Database/Database.js")
const CreateQueries = require("../Js/Database/CreateQueries.js")
const GetQueries = require("../Js/Database/GetQueries.js")
SECRET = "BruhnsmanIsTheBest"

afterAll(done =>{
    app.server.close(done);
})

jest.mock("../Js/Database/Database.js")
jest.mock("../Js/Database/GetQueries.js")

describe('POST /tempToken', () => {
    it('should return a temporary JWT token if account does not exist', async () => {
        const message = {
            email: 'test@gmx.de',
            benutzername: 'testUser',
            password: 'testPassword'
        }

        // return a non-existing account
        GetQueries.checkIfAccountIsInUse.mockResolvedValue({
            success: true,
            exists: false,
            error: null
        })

        const token = jwt.sign(message, SECRET, { expiresIn: '0.5h' })

        const res = await request(app)
            .post('/tempToken')
            .send(message)

        expect(res.status).toBe(200);

        const decodedResToken = jwt.verify(res.text, SECRET)
        const decodedToken = jwt.verify(token, SECRET)

        expect(decodedResToken.email).toEqual(decodedToken.email)
        expect(decodedResToken.benutzername).toEqual(decodedToken.benutzername)
        expect(decodedResToken.password).toEqual(decodedToken.password)
    })

    it('should return "Account already exists!" if the account already exists', async () => {
        const message = {
            email: 'test@gmx.de',
            benutzername: 'existingUser',
            password: 'testPassword'
        }

        // return an existing account
        GetQueries.checkIfAccountIsInUse.mockResolvedValue({
            success: true,
            exists: true,
            error: null
        })

        const res = await request(app)
            .post('/tempToken')
            .send(message)

        expect(res.status).toBe(200)
        expect(res.text).toEqual("Account already exists!")
    })

    it('should return an error message if there is an issue checking the account', async () => {
        const message = {
            email: 'error@gmx.de',
            benutzername: 'errorUser',
            password: 'testPassword'
        };

        // simulate an error
        GetQueries.checkIfAccountIsInUse.mockResolvedValue({
            success: false,
            exists: null,
            error: 'Database error'
        })

        const res = await request(app)
            .post('/tempToken')
            .send(message)

        expect(res.status).toBe(500)
        expect(res.text).toContain("Failed to create a temporary token: ")
    })
})

describe('POST /login',()=>{
    it('Should return a jwt token',async () => {
        const message = {
            body: {
                email: 'test@gmx.de',
                pass: 'test'
            }
        }

        const fakeUser = {
            success: true,
            user: {
                id: 1, 
                email: message.body["email"],
                pass: message.body["pass"]
            },
            error: null
        }

        database.comparePassword.mockImplementation((email, password)=>{return fakeUser}) // simulation of response for valid user login
        const token = jwt.sign(fakeUser["user"],SECRET,{expiresIn: '3h'})

        try {
            const res = await request(app.app).post('/login').send(message)
            expect(res.status).toBe(200)
            expect(res.text).toEqual(token)
        } catch(err) {
            console.error(err)
            throw err
        }
    },10000)
})

// this one is outdated, but I want to keep it, because there was a lot of effort put into it :D
xdescribe('POST /register',()=>{
    it('should return a User created',async () => {
        const message = {
            body:{
                email: 'test@gmx.de',
                pass: 'test',
                name:'testUser'
            }
        }

        jest.spyOn(CreateQueries,'createEndUser').mockResolvedValue(true)
        try {
            const res = await request(app.app).post('/register').send(message)
            expect(res.status).toBe(200)
            expect(res.text).toEqual("User created")
        } catch(err) {
            console.error(err)
            throw err
        }
    },10000)
})