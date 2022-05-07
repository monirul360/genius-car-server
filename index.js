const express = require("express");
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
//Middlewire
app.use(cors());
app.use(express.json());
function veryfytwt(req, res, next) {
    const auth = req.headers.authzation;
    if (!auth) {
        return res.status(401).send({ message: 'unaccess your data' })
    }
    const token = auth.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    });
}
// mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const query = require("express/lib/middleware/query");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vxtcn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const Carcollection = client.db("genius-car").collection('service');
        const Ordercollection = client.db("genius-car").collection('order');
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = Carcollection.find(query);
            const service = await cursor.toArray();
            res.send(service);
        })

        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await Carcollection.insertOne(newService);
            res.send(result);
        })

        app.get("/service/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await Carcollection.findOne(query);
            res.send(service);
        })
        // order api
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await Ordercollection.insertOne(order);
            res.send(result);
        })

        // order api 
        app.get('/order', veryfytwt, async (req, res) => {
            const decodedemail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedemail) {
                const query = { email: email };
                const cursor = Ordercollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } else {
                return res.status(403).send({ message: 'Forbidden access' })
            }
        })
        // login 
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accesstoken = jwt.sign(user, process.env.ACCESS_KEY, {
                expiresIn: '1d'
            })
            res.send({ accesstoken });
        })
        // delete 
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await Carcollection.deleteOne(query);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Successful runnig server!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})