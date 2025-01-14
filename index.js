require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const morgan = require('morgan');
const { MongoClient, ServerApiVersion } = require('mongodb');


// middleware
app.use(cors(
  { 
    origin:['http://localhost:5173']
   }
));
app.use(express.json());
app.use(morgan('dev'))




// mongo db uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pm9ea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
//   main code
    // database collection
     const database = client.db('nexusTech')
     const usersCollection = database.collection('users')



    // user info save to database
    app.post('/users', async(req,res)=>{
      const userInfo = req.body;
      const query = {userEmail:userInfo?.userEmail}
      const isExist = await usersCollection.findOne(query);
      if(isExist) return res.status(409).send({message:"user info conflict"})
      const result = await usersCollection.insertOne(userInfo);
      res.send(result)
    })









    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// basic server set up
app.get('/', (req, res)=>{
    res.send("NexusTech server running...")
})
app.listen(port , ()=>{
  console.log(`NexusTech is running on the port ${port}`);
})