import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";

import {GetTicketDetails, postMessage, ticketList} from './debugData.js';


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


httpServer.listen(port, () => {
  console.log(`Client application is running at: http://localhost:${port}`);
});

//Return user data from database.
clientApp.get(
  "/self",
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
  "/headers",
  passport.authenticate("jwt", { session: false }),    
  async (req, res) => {
    //Check for autherized user
    if (req.user) {
      try{
        //Initialize database
        const database =(await connection).db('ticketdb');

        //Gets all ticket heads user owns
        const heads = await database.collection('ticket_heads').find({"owner": req.user.id}).toArray();

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
  "/header/:id",
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
  "/details/:id",
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
  "/status/:id",
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
  "/details/:id",
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
          {$push: {messages: {message: req.body.message, sender:req.user.id, date: new Date()}}});

        //Update last activity on ticket head
        database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(req.params.id)}, {$set: {last_event: new Date()}});

        //Update last activity on user
        database.collection('client_users').updateOne({_id: ObjectId.createFromHexString(req.user.id)}, {$set: {last_active: new Date()}});

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
  "/message",
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
          owner: req.user.id,
          admin: "",
          subject: req.body.subject,
        }
        const newId = await (await database.collection('ticket_heads').insertOne(head)).insertedId.toString();

        const details = {
          _id: ObjectId.createFromHexString(newId),
          messages:[{
            date: newDate,
            message: req.body.message,
            sender: req.user.id,
          }]
        }

        await (await database.collection('ticket_details').insertOne(details));

        res.send({data: newId});

      } catch (err) { console.log(err) };
    } else {
      //Return unautherized
      res.status(401).end();
    }
  }
);

//Creates a new account and send 200 if successfull and 409 if user email already exist in database
clientApp.post("/createlogin", async (req, res) => {
  //Initialize database
  const database = (await connection).db('ticketdb');

  //Search in database for email
  const userTest = await database.collection('client_users').findOne({'email': req.body.email});

  //If email is new create the account
  if (!userTest)
  {
    console.log("client - mail not found, ok creating new")
    req.body.last_active = new Date();
    await (await database.collection('client_users').insertOne(req.body));

    res.status(200);
    res.send();

  } else {  //When email exist
    console.log("client - mail exist, sending error");
    //Return conflict
    res.status(409).end();
  }
});

//Login wirh user credentials that return a token to the client
clientApp.post("/login", async (req, res) => {
  //Initialize database
  const database =(await connection).db('ticketdb');

  //Gets the users information
  const userCred = await database.collection('client_users').findOne({email: req.body.username})

  //Handle a password match
  if (userCred && userCred.id2 === req.body.password) {
    console.log("client - authentication OK");

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
    console.log("client - wrong credentials");
    //Return unautherized
    res.status(401).end();
  }
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

httpAdminServer.listen(adminPort, () => {
  console.log(`Admin application is running at: http://localhost:${adminPort}`);
});

//Creates a new account and send 200 if successfull and 409 if user email already exist in database
adminApp.post("/createlogin", async (req, res) => {
  //Initialize database
  const database = (await connection).db('ticketdb');

  //Search in database for email
  const userTest = await database.collection('admin_users').findOne({'email': req.body.email});

  //If email is new create the account
  if (!userTest)
  {
    console.log("admin - email not found, ok creating new")
    req.body.last_active = new Date();
    await (await database.collection('admin_users').insertOne(req.body));

    res.status(200);
    res.send();

  } else {  //When email exist
    console.log("Email exist, sending error");
    //Return conflict
    res.status(409).end();
  }
});

//Login wirh user credentials that return a token to the client
adminApp.post("/login", async (req, res) => {
  //Initialize database
  const database =(await connection).db('ticketdb');

  //Gets the users information
  const userCred = await database.collection('admin_users').findOne({email: req.body.username})

  //Handle a password match
  if (userCred && userCred.id2 === req.body.password) {
    console.log("admin - authentication OK");

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
    console.log("admin - wrong credentials");
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
  console.log("Attempted connect")
  const req = socket.request;

  //Extra layer of security preventing users to access admin services, instead of using two passports
  const database =(await connection).db('ticketdb');
  const userCred = await database.collection('admin_users').findOne(ObjectId.createFromHexString(req.user.id))
  if (!userCred)
    socket.disconnect();

  socket.on("whoami", (cb) => {
    cb(req.user.username);
  });

  //Send headers on request
  socket.on("headers", async (q, cb) => {
    //Initialize database
    const database =(await connection).db('ticketdb');
    
    if (q === 'unassigned')
      cb(await database.collection('ticket_heads').find({"admin": ""}).toArray());
    
    if (q === 'user')
      cb(await database.collection('ticket_heads').find({"admin": ObjectId.createFromHexString(req.user.id)}).toArray());

  });

  socket.on("details", async (id, cb) => {
    try{
      //Initialize database
      const database =(await connection).db('ticketdb');
      const details = await database.collection('ticket_details').findOne(ObjectId.createFromHexString(id));
      cb(details);
    }
    catch (err) { console.log(err) };
    //cb(GetTicketDetails(id));
  });
  socket.on('pushStatus', (data) => {
    //pushStatus(data);
  });
  socket.on('pushMessage', async (data, cb) => {
    try{
      //Initialize database
      const database =(await connection).db('ticketdb');

      //Adds the message to the ticket details
      await database.collection('ticket_details').updateOne(
        {_id: ObjectId.createFromHexString(data.id)},
        {$push: {messages: {message: data.message, sender:req.user.id, date: new Date()}}});

      //Update last activity on ticket head
      database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(data.id)}, {$set: {last_event: new Date(), status: 2}});

      //Update last activity on user
      database.collection('client_users').updateOne({_id: ObjectId.createFromHexString(data.id)}, {$set: {last_active: new Date()}});

      //Return the new updated ticket details
      cb(await database.collection('ticket_details').findOne(ObjectId.createFromHexString(data.id)));
    } catch (err) { console.log(err) };
  });
    
});
//#endregion

//---------------------------------------------------------------------------
//---------------------------------Database----------------------------------
//---------------------------------------------------------------------------


// use when starting application locally
const mongoUrlLocal = "mongodb://admin:password@localhost:27017";

// use when starting application as docker container
const mongoUrlDocker = "mongodb://admin:password@mongodb";

const mongoClient = new MongoClient(mongoUrlLocal);

const connection = mongoClient.connect();

