const request = require("supertest")
const app = require("../Js/Server")
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const database = require("../Js/Database/Database.js")
const CreateQueries = require("../Js/Database/CreateQueries.js")
SECRET = "BruhnsmanIsTheBest"

afterAll(done =>{
    app.server.close(done);
});

describe('POST /login',()=>{
    it('should return a jwt token',async ()=>{
        const message={
                        body:{
                            email: 'test@gmx.de',
                            pass: 'test'}
                    };

        const fakeUser = {
            success: true,
            user: {id: 1, email : message.body["email"], pass: message.body["pass"]},
            error: null
            
        }
        jest.spyOn(database,'comparePassword').mockResolvedValue(fakeUser);
        jest.spyOn(bcrypt,'compare').mockResolvedValue(true)
        const token = jwt.sign(fakeUser["user"],SECRET,{expiresIn: '3h'});
        try
        {
            const res = await request(app.app).post('/login').send(message);
            expect(res.status).toBe(200);
            expect(res.text).toEqual(token);
        }
        catch(err)
        {
            console.error(err)
            throw err;
        }
    },10000);
});

describe('POST /register',()=>{
    it('should return a User created',async ()=>{
        const message={
                        body:{
                            email: 'test@gmx.de',
                            pass: 'test',
                            name:'testUser'
                        }
                    };

        jest.spyOn(CreateQueries,'createEndUser').mockResolvedValue(true);
        try
        {
            const res = await request(app.app).post('/register').send(message);
            expect(res.status).toBe(200);
            expect(res.text).toEqual("User created");
        }
        catch(err)
        {
            console.error(err)
            throw err;
        }
    },10000);
});


