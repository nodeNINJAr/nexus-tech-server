require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const morgan = require('morgan');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

// middleware
app.use(cors(
  { 
    origin:['http://localhost:5173'],
    credentials:true,
   }
));
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));



// middleware for user verify
const verifyToken = (req,res, next)=>{
  const token = req?.cookies?.token;
  console.log(token);
  // validate if token is not available
  if(!token){
    return res.status(401).json({message:'Access denied. No token provided.'})
  }

  // verify if token have than sent,if not than err
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next()
  }
  catch(err){
    return res.status(401).json(({ message: 'Invalid or expired token.' }));
  }

}



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
    app.post('/users',verifyToken, async(req,res)=>{
      const userInfo = req.body;
      const query = {userEmail:userInfo?.userEmail}
      const isExist = await usersCollection.findOne(query);
      if(isExist) return res.status(409).send({message:"user info conflict"})
      const result = await usersCollection.insertOne(userInfo);
      res.send(result)
     
    })







// jwt token setup sign in to jwt
app.post('/login', async(req,res)=>{
   const email = req.body;
  // sign in to jwt
  const token = jwt.sign(email,process.env.JWT_SECRET_KEY,{expiresIn:"1d"});
  // set token to cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  })
  .send({message:"token is set on browser cookie"})
})
// token remove after user logout from site
app.post('/logout', (req,res)=>{
  res.clearCookie('token');
  res.send({message:'token removed succesfully'})
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