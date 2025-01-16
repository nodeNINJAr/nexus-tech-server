require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const morgan = require('morgan');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
     const usersCollection = database.collection('users');
     const submitedWorkCollection = database.collection('submitedWork')





// ---------------- ALL GET API HERE ------------------//

  // get specific employee work data
  app.get("/worksheet/:email", async (req,res)=>{
    const email = req.params.email;
    const filter ={employeeEmail:email};
    const result = await submitedWorkCollection.find(filter).toArray();
    res.send(result);
  })

  // get the user roll
  app.get('/user/role/:email', async(req,res)=>{
      const email = req.params.email;
      const query = {userEmail:email}
      const result = await usersCollection.findOne(query,{projection:{userRole:1,
      _id:0,
    }});
      res.send(result?.userRole)
  })
  // get all employee data
  app.get('/employee-list', async(req,res)=>{
    const filter ={userRole:"employee"};
    const result = await usersCollection.find(filter).toArray();
    res.send(result)
  })

  // get all employee submited work
  app.get('/submited-work', async(req, res)=>{
      const result = await submitedWorkCollection.find().toArray();
      res.send(result);
  } )



// ---------------- ALL POST API HERE ------------------//

  // employee work send to database by employee
  app.post('/daily-work', async(req,res)=>{
    const submitedData = req.body;
    const query = {workedDate:submitedData?.workedDate, employeeEmail:submitedData?.employeeEmail}
    const isExist = await submitedWorkCollection.findOne(query);
    if(isExist) return res.status(409).send({message:"You Cannot Submit Work Twice a Same Date"})
    const result = await submitedWorkCollection.insertOne(submitedData)
    res.send(result)
  })
    
  // user info save to database
  app.post('/users', async(req,res)=>{
    const userInfo = req.body;
    const query = {userEmail:userInfo?.userEmail}
    const isExist = await usersCollection.findOne(query);
    if(isExist) return res.status(409).send({message:"user info conflict"})
    const result = await usersCollection.insertOne(userInfo);
    res.send(result)
    
  })



// ---------------- ALL UPDATE API HERE ------------------//

// employee work update by own
app.put('/worksheet/:id', async (req,res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const info = req.body;
  const options = {upsert: true };
  const updatedInfo = {
      $set:{
        employeeEmail: info?.employeeEmail,
        taskName: info?.taskName,
        workedHour: info?.workedHour,
        workedDate: info?.workedDate,
      }
  };

  const result = await submitedWorkCollection.updateOne(filter,updatedInfo,options);
  res.send(result)

})

// employee verified status toggle by user
app.patch('/employee-verify/:id', async(req,res)=>{
  const id = req.params.id;
  const query = {_id:new ObjectId(id)};
  const verified = {
     $set:{
       verified:true,
     }
  }
  const result = await usersCollection.updateOne(query, verified)
  res.send(result)
})




// ---------------- ALL DELETE API HERE ------------------//

// employee work deleted by own
app.delete('/worksheet/:id', async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id) };
  const result = await submitedWorkCollection.deleteOne(query);
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