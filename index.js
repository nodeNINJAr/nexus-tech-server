require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const morgan = require('morgan');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "You are a cat. Your name is Neko.",
});

// middleware
app.use(cors(
  { 
    origin:['http://localhost:5173','https://nexustech-b3673.web.app','https://nexustech-b3673.firebaseapp.com','https://nexustechweb.netlify.app'],
    credentials:true,
   }
));
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));



// middleware for user verify
const verifyToken = async(req,res, next)=>{
  const token = req?.cookies?.token;
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
    // await client.connect();
//   main code
    // database collection
     const database = client.db('nexusTech')
     const usersCollection = database.collection('users');
     const submitedWorkCollection = database.collection('submitedWork');
     const paymentRequestsCollection = database.collection('payRequests');
     const paymentHistoryCollection = database.collection('paymentHistory')
     const contactMessageCollection = database.collection('AllMessage')

  // verify token for employee
  const verifyEmployee = async(req,res, next)=>{
    const verifiedEmail = req.user.email;
    const query = {
      userEmail:verifiedEmail,
    }
    const user = await usersCollection.findOne(query);
    if(!user || user?.userRole !== "employee"){
      return res.status(403).send('Forbidden Access')
    }
    next()
  }

   // verify token for employee
   const verifyHr = async(req,res, next)=>{
    const verifiedEmail = req.user.email;
    const query = {
      userEmail:verifiedEmail,
    }
    const user = await usersCollection.findOne(query);
    if(!user || user?.userRole !== "hr"){
      return res.status(403).send('Forbidden Access')
    }
    next()
  }

   // verify token for employee
   const verifyAdmin = async(req,res, next)=>{
    const verifiedEmail = req.user.email;
    const query = {
      userEmail:verifiedEmail,
    }
    const user = await usersCollection.findOne(query);
    if(!user || user?.userRole !== "admin"){
      return res.status(403).send('Forbidden Access')
    }
    next()
  }


// ---------------- ALL GET API HERE ------------------//

app.get('/gemini-ai', async (req, res)=>{
  const prompt = req.query?.prompt;
  // 
  if(!prompt){
      return res.status(400).send({message:"Please provided prompt for use help of ai"})
  }

  // 
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  res.send({response:result.response.text()})

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
  app.get('/employee-list',verifyToken,  async(req,res)=>{
    const filter ={userRole:"employee"};
    const totalEmployee = await usersCollection.find(filter).toArray();
    //  
   const employeeCount = await usersCollection.aggregate([
      {
        $match:filter,
      },
      {
        $group:{
          _id:'$designation',
          count:{$sum:1},
        }
      },
      {
        $project:{
          _id:0,
          designation:'$_id',
          count:1,
        }
      }
      
   ]).toArray();

    res.send({employeeCount,totalEmployee})
  })
  // all hr and verifed employee data except admin
  app.get('/users',verifyToken,verifyAdmin, async(req,res)=>{
    // get data by different value
    const filter ={
      // matching
      userRole:{$in:["employee" , "hr"]},
      // additional condition
      $or :[
        {userRole:"employee", isVerified:true},
        {userRole:"hr"}
      ]
    
    };
    // 
    const result = await usersCollection.find(filter).toArray();
    res.send(result)
  })
  // all user data 
  app.get('/all-users/:email',verifyToken, async(req,res)=>{
    const email= req.params.email;
    const verifiedEmail = req?.user?.email;
    if(verifiedEmail !== email){
     return res.status(403).send({message:"Forbidden Access"})
    }
    // 
    const result = await usersCollection.findOne({userEmail:email});
    res.send(result)
  })
  // not verified for checking user on login is fired or not
  app.get('/fired/:email', async(req,res)=>{
    const email = req.params.email;
    const query = {
          userEmail:email,
          fired:true,
    }
      const result = await usersCollection.findOne(query);
      res.send({fired:result?.fired})
  })
  // get specific employee work data
  app.get("/worksheet/:email",verifyToken,verifyEmployee, async (req,res)=>{
    const email = req.params.email;
    const filter ={employeeEmail:email};
    const result = await submitedWorkCollection.find(filter).toArray();
    res.send(result);
  })
  // get all employee submited work
  app.get('/submited-work',verifyToken, verifyHr, async(req, res)=>{
      const queryData = req.query;
     const query = {};
    //  filtered by date
     if (queryData?.month) {
      const month = parseInt(queryData.month, 10); // Ensure month is a number
      query.$expr = { $eq: [{ $month:{ $toDate:"$workedDate"} }, month] };//date mustbe converted todate is date is string
    }
    // name filtering
    if (queryData?.name) {
      query.employeeName = queryData.name;
    }
    // 
    const result = await submitedWorkCollection.aggregate([
       {$match:query},
       {
        $group:{
          _id:null,
          totalWorkedHour:{$sum:"$workedHour"},
          filteredWork:{$push:"$$ROOT"}
        },
       }
    ]).toArray();
      res.send(result);
  } )

  // get all payment request on admin
    app.get("/payment-requests",verifyToken,verifyAdmin, async (req, res) => {
      // 
      const result = await paymentRequestsCollection.find().toArray();
      res.send(result)
    });
    

  // admin state
  app.get("/admin-stats",verifyToken,verifyAdmin, async(req,res)=>{
      // 
      const totalUsers= await usersCollection.estimatedDocumentCount();
      // calculate total salary
      const expenses = await paymentHistoryCollection.aggregate([
        {
         $group:{
            _id:null,
           expenses:{
              $sum:"$salary" 
            }
         }
        }
     ]).toArray();

     // Calculate total worked hours
     const workedHoursData = await submitedWorkCollection.aggregate([
      {
        $group: {
          _id: null,
          totalWorkedHours: {
            $sum: "$workedHour",
          },
        },
      },
    ]).toArray();
    // 
     const totalExpenses = expenses[0].expenses || 0;
     const totalWorkedHours = workedHoursData[0]?.totalWorkedHours || 0;
     res.send({totalUsers, totalExpenses,totalWorkedHours })
  })

  //get all contact message from users colection
  app.get('/contacts',verifyToken,verifyAdmin, async(req,res)=>{
    const skip = parseInt(req?.query?.size);
    const result = await contactMessageCollection.find().skip(skip).limit(5).sort({_id:-1}).toArray();
    res.send(result);
  })

  // get payment history by different slug this get by hr and employee with pagination
  app.get('/payment-history/:slug',verifyToken, async (req, res) => {
    const monthMap = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };
  // 
    try {
      const { slug } = req.params;
      const { page=1 , limit=5  } = req.query; // Default to page 1, limit 5
      const skip = (page - 1) * limit; // Calculate the number of documents to skip
      // 
      let query = {};
      let sort = { _id: -1 }; // Default sort: descending by _id
    
      // Check if slug contains an email
      if (slug.includes('@')) {
        const user = await usersCollection.findOne({ userEmail: slug });
        if (!user) {
          return res.status(404).send({ error: 'User not found by email' });
        }
        query.employeeId = user._id.toString();

      
      } else {
        query.employeeId = slug;
        sort = {}; 
      }

      // to hr
      const payments = await paymentHistoryCollection
        .find(query)
        .sort(sort)
        .toArray();


        // Fetch payment history with pagination
        const totalRecords = await paymentHistoryCollection.countDocuments(query);
        //to employee
        const paymentsInfo = await paymentHistoryCollection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      // Custom sorting if the request is by employee ID
      if (!slug.includes('@')) {
        payments.sort((a, b) => {
          // Check if the year is the same
          if (a.year !== b.year) {
            return b.year - a.year;
          }
          // Sort by month
          return monthMap[b.month] - monthMap[a.month];
        });
      }


      res.send({
        paymentsInfo,
        payments,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
      });
    } catch (error) {
      res.status(500).send({ error: 'An error occurred while fetching payment history' });
    }
  });

  // salary-request-summary
  app.get('/salary-request-summary',verifyToken, verifyAdmin, async (req, res) => {
    try {
      const salaryRequestData = await paymentRequestsCollection.aggregate([
        {
          $group: {
            _id: { month: "$month", year: "$year" },
            receivedSalary: {
              $sum: {
                $cond: [{ $eq: ["$status", "approved"] }, 1, 0], 
              },
            },
            notReceivedSalary: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["pending", "rejected"]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0, // Exclude the default _id field
            name: { $concat: ["$_id.month", " ", { $toString: "$_id.year" }] },
            receivedSalary: 1,
            notReceivedSalary: 1,
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 }, 
        },
      ]).toArray();
  
      res.send(salaryRequestData);
    } catch (error) {
      console.error("Error fetching salary request summary:", error);
      res.status(500).send("Internal Server Error");
    }
  });


// ---------------- ALL POST API HERE ------------------//

  // employee work send to database by employee
  app.post('/daily-work',verifyToken,verifyEmployee, async(req,res)=>{
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


  //  pay request by hr
   app.post('/payment/request',verifyToken, verifyHr, async (req, res) => { 
    // 
    try { 
    const { employeeId,employeeName, salary, month, year, hrEmail } = req.body; 
    const paymentRequest = { 
            employeeName,
            employeeId,
            salary,
            month,
            year, 
            hrEmail, 
            requestDate: new Date().toLocaleDateString(), 
            status: 'pending' 
           }; 
      const query = {employeeId, month, year}
      const isExist = await paymentRequestsCollection.findOne(query);
      if(isExist) return res.status(409).send({message:`Pay request for ${month}, ${year} has already been submitted.`})
      const result = await paymentRequestsCollection.insertOne(paymentRequest); 
      res.json({ message:`Pay request for ${employeeName} has been successfully submitted for ${month} ${year}.`, paymentRequest: result}); 
    }
       catch (error) { 
        res.status(500).json({ error: 'Internal Server Error' });
       }
      
      });
      
  //  pay approve by admin
   app.post('/approve-pay-request',verifyToken,verifyAdmin, async (req, res) => { 
      try { 
      const {paymentRequestId} = req.body; 
      const paymentRequest = await paymentRequestsCollection.findOne({ _id: new ObjectId(paymentRequestId)}); 
      if (!paymentRequest) { 
          return res.status(404).json({ error: 'Payment request not found' });
          } 
      if (paymentRequest.status === 'approved'){
        return res.status(409).json({ message: 'Payment request already approved' });
      }
     const paymentIntent = await stripe.paymentIntents.create({ 
          amount: paymentRequest.salary * 100,
          // Stripe works in cents
          currency: 'usd',
          payment_method_types: ['card'],
          });
         await paymentRequestsCollection.findOneAndUpdate( { _id: new ObjectId(paymentRequestId) }, { $set: { status: 'approved' , paidAt: new Date().toLocaleDateString()} }, { returnOriginal: false } );
        const paymentHistory = {
            employeeId: paymentRequest.employeeId,
            salary: paymentRequest.salary,
            month: paymentRequest.month, 
            year: paymentRequest.year, 
            hrEmail: paymentRequest.hrEmail,
            paymentIntentId: paymentIntent.id,
            status: 'paid',
            paidAt: new Date().toLocaleDateString()
        };
        await paymentHistoryCollection.insertOne(paymentHistory); 
        // clientSecret: paymentIntent.client_secret,
 
        res.json({ status: 'paid',}); }
      catch (error) { 
        res.status(500).json({ error: 'Internal Server Error' }); 
      } 
    });

  // contact message by users
  app.post('/contact', async(req,res)=>{
    const info = req.body;
    const result = await contactMessageCollection.insertOne(info);
    res.send(result);
  })


// ---------------- ALL UPDATE API HERE ------------------//

// employee work update by own
app.put('/worksheet/:id',verifyToken,verifyEmployee, async (req,res)=>{
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

// employee verified status toggle by hr
app.patch('/employee-verify/:id',verifyToken,verifyHr, async(req,res)=>{
  const id = req.params.id;
  const query = {_id:new ObjectId(id)};
  const verified = {
     $set:{
       isVerified:true,
     }
  }
  const result = await usersCollection.updateOne(query, verified)
  res.send(result)
})

// employee to hr by admin
app.patch('/make-hr/:id',verifyToken,verifyAdmin, async(req,res)=>{
  const id= req.params.id;
  const query = {_id:new ObjectId(id)};
  const userRole = {userRole:"hr",_id:new ObjectId(id)}
 //  find existing data
  const isExist = await usersCollection.findOne(userRole);
  if(isExist){
    return res.status(409).send({message:"This employee is already HR."}) 
  }
// make hr
  const makeHr = {
      $set:{userRole:"hr"}
  }
  const result = await usersCollection.updateOne(query, makeHr);
  res.send(result)
})

// employee fired by admin
app.patch('/fired/:id',verifyToken,verifyAdmin, async(req,res)=>{
  const id= req.params.id;
  const query = {_id:new ObjectId(id)};
  const fired = {
      $set:{fired:true}
  }
  const result = await usersCollection.updateOne(query,fired);
  res.send(result)
})
// salary update by admin
app.patch("/pay/salary-update",verifyToken,verifyAdmin, async(req,res)=>{
    const {_id,currentSalary,newSalary} = req.body;
    if(newSalary <= currentSalary){
      return res.status(400).send({message:"New Salary will be bigger than current Value"})
    }
    const query = {_id:new ObjectId(_id)};
    const salaryInfo = {
       $set:{
          salary:parseInt(newSalary)
       }
    };
    const result = await usersCollection.findOneAndUpdate(query,salaryInfo);
    res.send(result);
})


// ---------------- ALL DELETE API HERE ------------------//

// employee work deleted by own
app.delete('/worksheet/:id',verifyToken,verifyEmployee, async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id) };
  const result = await submitedWorkCollection.deleteOne(query);
  res.send(result)
})

app.delete('/contact/:id',verifyToken, verifyAdmin, async(req,res)=>{
   const id = req?.params?.id;
   const query = {_id: new ObjectId(id)};
   const result = await contactMessageCollection.deleteOne(query);
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