const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// function to verify Token
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res
            .status(401)
            .send({ error: true, message: 'Unauthorized Access' });
    }

    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res
                .status(403)
                .send({ error: true, message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gaiflbq.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const run = async () => {
    try {
        // Collection
        const productsCollection = client.db('rkStore').collection('products');

        // JWT Token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h',
            });
            res.send({ token });
        });

        // Products API
        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // Single Product API
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        });

        // My Items API
        app.get('/myitems', verifyJWT, async (req, res) => {
            let query = {};
            const decoded = req.decoded;
            if (req.query.email) {
                query = {
                    email: req.query.email,
                };
            }
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' });
            }
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // Add Product API
        app.post('/inventory', verifyJWT, async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        // Update Product API
        app.put('/inventory/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const updatedProductQuantity = req.body.productQuantity;
            const updatedProductSold = req.body.productSold;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedProductQuantity,
                    sold: updatedProductSold,
                },
            };
            const result = await productsCollection.updateOne(
                filter,
                updatedDoc,
                options
            );
            res.send(result);
        });

        // Delete Product API
        app.delete('/inventory/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        });
    } finally {
    }
};
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('This is RK-Store Server');
});

app.listen(port, () => {
    console.log(`RK-Store is running on port ${port}`);
});
