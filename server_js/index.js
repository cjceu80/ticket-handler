import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";



//---------------------------------------------------------------------------
//-----------------------------------Token-----------------------------------
//---------------------------------------------------------------------------
//#region
const jwtSecret = "Mys3cr3t";

const jwtDecodeOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
  issuer: "accounts.notarealplace.com",
  audience: "mysite.net",
};

passport.use(
  new JwtStrategy(jwtDecodeOptions, (payload, done) => {
    return done(null, payload.data);
  }),
);
//#endregion

//---------------------------------------------------------------------------
//-----------------------------CLient API server-----------------------------
//---------------------------------------------------------------------------
//#region

const clientApp = express();
const httpServer = createServer(clientApp);
const port = process.env.PORT || 3000;

clientApp.use(bodyParser.json());
clientApp.use(cors({origin: "*"}));

const __filename = fileURLToPath(import.meta.url);

// 👇️ "/home/john/Desktop/javascript"
const __dirname = path.dirname(__filename);

clientApp.use(express.static(path.join(__dirname, 'dist/client')));


httpServer.listen(port, () => {
  console.log(`${new Date().toLocaleString()} - Client application is running at: http://localhost:${port}`);
});

//Return user data from database.
clientApp.get(
  "/api/self",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user) {
      res.send(req.user);
    } else {
      res.status(401).end();
    }
  },
);

//Returns all ticket heads from database
clientApp.get(
  "/api/headers",
  passport.authenticate("jwt", { session: false }),    
  async (req, res) => {
    //Check for autherized user
    if (req.user) {
      try{
        //Initialize database
        const database =(await connection).db('ticketdb');

        //Gets all ticket heads user owns
        const heads = await database.collection('ticket_heads').find({"owner": ObjectId.createFromHexString(req.user.id)}).toArray();

        //Update the users last activity
        database.collection('client_users').updateOne({_id: ObjectId.createFromHexString(req.user.id)}, {$set: {last_active: new Date}});

        //Return the result to the user client
        res.send({data: heads});
      }
    catch (err) { console.log(err) };
    } else {
      //Return unautherized
      res.status(401).end();
    }
  },
);

//Return a header for given ticket id
clientApp.get(
  "/api/header/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    
    //Check for autherized user
    if (req.user) {
      try{
        //Initialize database 
        const database =(await connection).db('ticketdb');
        const heads = await database.collection('ticket_heads').findOne(ObjectId.createFromHexString(req.user.id))
        res.send({data: heads});
      }
      catch (err) { console.log(err) };
    } else {
      //Return unautherized
      res.status(401).end();
    }
  },
);

//Return all detailed data from ticket by provided id in the params. 
clientApp.get(
  "/api/details/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    
    //Check for autherized user
    if (req.user) {
      try{
        //Initialize database
        const database =(await connection).db('ticketdb');
        const details = await database.collection('ticket_details').findOne(ObjectId.createFromHexString(req.params.id));
        res.send(details);
      }
      catch (err) { console.log(err) };
    } else {
      //Return unautherized
      res.status(401).end();
    }
  },
);

//Updates the status on a ticket head. Used for when a user open an un-opened message
clientApp.post(
  "/api/status/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {

    //Check for autherized user
    if (req.user) {
      try{
        //Initialize database
        const database =(await connection).db('ticketdb');
        //Updates the ticket head status
        database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(req.params.id)}, {$set: {status: req.body.status}});
      }
      catch (err) { console.log(err) };
    } else {
      //Return unautherized
      res.status(401).end();
    }
  },
);

clientApp.post(
  "/api/details/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {

    //Check for autherized user
    if (req.user) {
      try{
        //Initialize database
        const database =(await connection).db('ticketdb');

        //Adds the message to the ticket details
        await database.collection('ticket_details').updateOne(
          {_id: ObjectId.createFromHexString(req.params.id)},
          {$push: {messages: {message: req.body.message, sender:ObjectId.createFromHexString(req.user.id), sender_name: req.user.name, date: new Date()}}});

        //Update last activity on ticket head
        database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(req.params.id)}, {$set: {last_event: new Date(), status: 1}});

        //Update last activity on user
        database.collection('client_users').updateOne({_id: ObjectId.createFromHexString(req.user.id)}, {$set: {last_active: new Date()}});

        //sends for admins heads to update if connected
        const head = database.collection('ticket_heads').findOne(ObjectId.createFromHexString(req.params.id))
        io.in(head.admin).emit('updateHeaders')

        //Return the new updated ticket details
        res.send(await database.collection('ticket_details').findOne(ObjectId.createFromHexString(req.params.id)));
      } catch (err) { console.log(err) };
    } else {
      //Return unautherized
      res.status(401).end();
    }
  }
);

clientApp.post(
  "/api/message",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {

    //Check for autherized user
    if (req.user) {
      try{
        //Initialize database
        const database =(await connection).db('ticketdb');
        const newDate = new Date();
        const head = {
          status: 1,
          date: newDate,
          last_event: newDate,
          owner: ObjectId.createFromHexString(req.user.id),
          admin: "",
          subject: req.body.subject,
        }
        const newId = await (await database.collection('ticket_heads').insertOne(head)).insertedId.toString();

        const details = {
          _id: ObjectId.createFromHexString(newId),
          messages:[{
            date: newDate,
            message: req.body.message,
            sender: ObjectId.createFromHexString(req.user.id),
            sender_name: req.user.name
          }]
        }

        await (await database.collection('ticket_details').insertOne(details));

        //Sends to all connected admins to update headers
        io.emit('updateHeaders')

        res.send({data: newId});

      } catch (err) { console.log(err) };
    } else {
      //Return unautherized
      res.status(401).end();
    }
  }
);

//Creates a new account and send 200 if successfull and 409 if user email already exist in database
clientApp.post("/api/createlogin", async (req, res) => {
  //Initialize database
  const database = (await connection).db('ticketdb');

  //Search in database for email
  const userTest = await database.collection('client_users').findOne({'email': req.body.email});

  //If email is new create the account
  if (!userTest)
  {
    console.log(`${new Date().toLocaleString()} - Client - mail not found, ok creating new`)
    req.body.last_active = new Date();
    await (await database.collection('client_users').insertOne(req.body));

    res.status(200);
    res.send();

  } else {  //When email exist
    console.log(`${new Date().toLocaleString()} - Client - mail exist, sending error`);
    //Return conflict
    res.status(409).end();
  }
});

//Login wirh user credentials that return a token to the client
clientApp.post("/api/login", async (req, res) => {
  //Initialize database

  const database =(await connection).db('ticketdb');

  //Gets the users information
  const userCred = await database.collection('client_users').findOne({email: req.body.username})

  //Handle a password match
  if (userCred && userCred.id2 === req.body.password) {
    console.log(`${new Date().toLocaleString()} - Client - authentication OK`);

    //User object to sign
    const user = {
      id: userCred._id.toString(),
      username: userCred.email,
      name: `${userCred.first_name} ${userCred.last_name}`
    };

    //Creating a signed token
    const token = jwt.sign(
      {
        data: user,
      },
      jwtSecret,
      {
        issuer: "accounts.notarealplace.com",
        audience: "mysite.net",
        expiresIn: "1h",
      },
    );

    //Return signed token
    res.json({ token });

  } else {
    console.log(`${new Date().toLocaleString()} - Client - wrong credentials`);
    //Return unautherized
    res.status(401).end();
  }
});

clientApp.get('*', (req,res) => {
  res.sendFile(path.join(__dirname, 'dist/client/index.html'));
 });
//#endregion

//---------------------------------------------------------------------------
//--------------------------Websocket Admin Server---------------------------
//---------------------------------------------------------------------------
//#region

const adminApp = express();
const httpAdminServer = createServer(adminApp);
const adminPort = process.env.PORT || 4000;

adminApp.use(bodyParser.json());
adminApp.use(cors({origin: "*"}));

adminApp.use(express.static(path.join(__dirname, 'dist/admin')));

httpAdminServer.listen(adminPort, () => {
  console.log(`${new Date().toLocaleString()} - Admin application is running at: http://localhost:${adminPort}`);
});


//Creates a new account and send 200 if successfull and 409 if user email already exist in database
adminApp.post("/api/createlogin", async (req, res) => {
  //Initialize database
  const database = (await connection).db('ticketdb');

  //Search in database for email
  const userTest = await database.collection('admin_users').findOne({'email': req.body.email});

  //If email is new create the account
  if (!userTest)
  {
    console.log(`${new Date().toLocaleString()} - Admin - email not found, ok creating new`)
    req.body.last_active = new Date();
    await (await database.collection('admin_users').insertOne(req.body));

    res.status(200);
    res.send();

  } else {  //When email exist
    console.log(`${new Date().toLocaleString()} - Admin - email exist, sending error`);
    //Return conflict
    res.status(409).end();
  }
});

//Login wirh user credentials that return a token to the client
adminApp.post("/api/login", async (req, res) => {
  //Initialize database
  console.log(req.body);

  const database =(await connection).db('ticketdb');

  //Gets the users information
  const userCred = await database.collection('admin_users').findOne({email: req.body.username})

  //Handle a password match
  if (userCred && userCred.id2 === req.body.password) {
    console.log(`${new Date().toLocaleString()} - Admin - authentication OK`);

    //User object to sign
    const user = {
      id: userCred._id.toString(),
      username: userCred.email,
      name: `${userCred.first_name} ${userCred.last_name}`
    };

    //Creating a signed token
    const token = jwt.sign(
      {
        data: user,
      },
      jwtSecret,
      {
        issuer: "accounts.notarealplace.com",
        audience: "mysite.net",
        expiresIn: "1h",
      },
    );

    //Return signed token
    res.json({ token });

  } else {
    console.log(`${new Date().toLocaleString()} - Admin - wrong credentials`);
    //Return unautherized
    res.status(401).end();
  }
});

const io = new Server(httpAdminServer, {
  cors: {
      origin: "*"
  }});

io.engine.use((req, res, next) => {
  const isHandshake = req._query.sid === undefined;
  if (isHandshake) {
    passport.authenticate("jwt", { session: false })(req, res, next);
  } else {
    next();
  }
});

io.on("connection", async (socket) => {
  const req = socket.request;
  
  //Initialize database
  const database =(await connection).db('ticketdb');

  //Extra layer of security preventing users to access admin services, instead of using two passports
  const userCred = await database.collection('admin_users').findOne(ObjectId.createFromHexString(req.user.id))
  if (!userCred){
    socket.disconnect();
    console.log(`${new Date().toLocaleString()} - ${req.user.username} attempted unauthorized admin access - connection denied`)
  }

  console.log(`${new Date().toLocaleString()} - Admin ${req.user.username} has connected`)

  //Joins own channel
  socket.join(req.user.user);

  socket.on("whoami", (cb) => {
    cb(req.user.id);
  });

  //Send headers on request
  socket.on("headers", async (cb) => {
    console.log("headers")
      cb(await database.collection('ticket_heads').find({$or: [{"admin": ""},{"admin": ObjectId.createFromHexString(req.user.id)}]}).toArray());
  });

  socket.on("details", async (id, cb) => {
    try{
      const details = await database.collection('ticket_details').findOne(ObjectId.createFromHexString(id));
      
      cb(details);
    }
    catch (err) { console.log(err) };

  });

  socket.on('pushStatus', (data) => {
    try{
      database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(data.id)}, {$set: {status: data.status}});
      io.emit('updateHeaders');
    }
    catch (err) { console.log(err) };
  });

  socket.on('acceptTicket', async (id) => {
    try{
      await database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(id)}, {$set: {admin: ObjectId.createFromHexString(req.user.id)}});
      
      io.emit('updateHeaders');
    }
    catch (err) { console.log(err) };
  });

  socket.on('pushMessage', async (data, cb) => {
    try{
      //Adds the message to the ticket details
      await database.collection('ticket_details').updateOne(
        {_id: ObjectId.createFromHexString(data.id)},
        {$push: {messages: {message: data.message, sender: ObjectId.createFromHexString(req.user.id), sender_name: req.user.name, date: new Date()}}});

      //Update last activity on ticket head
      database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(data.id)}, {$set: {last_event: new Date(), status: 2}});

      //Update last activity on user
      database.collection('client_users').updateOne({_id: ObjectId.createFromHexString(data.id)}, {$set: {last_active: new Date()}});

      //Return the new updated ticket details
      cb(await database.collection('ticket_details').findOne(ObjectId.createFromHexString(data.id)));
    } catch (err) { console.log(err) };
  });
    
});

adminApp.get('*', (req,res) => {
  res.sendFile(path.join(__dirname, 'dist/admin/index.html'));
 });
//#endregion

//---------------------------------------------------------------------------
//---------------------------------Database----------------------------------
//---------------------------------------------------------------------------


// use when starting application locally
const mongoUrlLocal = "mongodb://admin:password@localhost:27017";

// use when starting application as docker container
const mongoUrlDocker = "mongodb://admin:password@mongodb";

const mongoClient = new MongoClient(mongoUrlDocker);

const connection = mongoClient.connect();
