import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";

import {GetTicketDetails, postMessage, setReadStatus, ticketList} from './debugData.js';

const port = process.env.PORT || 3000;
const jwtSecret = "Mys3cr3t";

//---------------------------------------------------------------------------
//---------------------------------API server--------------------------------
//---------------------------------------------------------------------------

const tokenApp = express();
const httpServer = createServer(tokenApp);

tokenApp.use(bodyParser.json());
tokenApp.use(cors({origin: "*"}));


//Return user data from database.
tokenApp.get(
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
tokenApp.get(
  "/headers",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user) {
      try{
      const database =(await connection).db('ticketdb');
      const heads = await database.collection('ticket_heads').find({"owner": ObjectId.createFromHexString(req.user.id)}).toArray()
      res.send({data: heads});
    }
    catch (err) { console.log(err) };
    } else {
      res.status(401).end();
    }
  },
);

tokenApp.get(
  "/header/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user) {
      try{
      const database =(await connection).db('ticketdb');
      const heads = await database.collection('ticket_heads').findOne(ObjectId.createFromHexString(req.user.id))
      res.send({data: heads});
    }
    catch (err) { console.log(err) };
    } else {
      res.status(401).end();
    }
  },
);

//Return all detailed data from ticket by provided id in the params. 
tokenApp.get(
  "/details/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user) {
      try{
        const database =(await connection).db('ticketdb');
        const details = await database.collection('ticket_details').findOne(ObjectId.createFromHexString(req.params.id));
        res.send(details);
      }
      catch (err) { console.log(err) };
    } else {
      res.status(401).end();
    }
  },
);


tokenApp.post(
  "/status/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user) {
      try{
        const database =(await connection).db('ticketdb');
        database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(req.params.id)}, {$set: {status: req.body.status}});
      }
      catch (err) { console.log(err) };
    } else {
      res.status(401).end();
    }
  },
);

tokenApp.post(
  "/details/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user) {
      try{
        const database =(await connection).db('ticketdb');
        await database.collection('ticket_details').updateOne(
          {_id: ObjectId.createFromHexString(req.params.id)},
          {$push: {messages: {message: req.body.message, sender:req.user.id, date: new Date()}}});
        database.collection('ticket_heads').updateOne({_id: ObjectId.createFromHexString(req.params.id)}, {$set: {last_event: new Date()}});
        res.send(await database.collection('ticket_details').findOne(ObjectId.createFromHexString(req.params.id)));
      } catch (err) { console.log(err) };
    } else {
      res.status(401).end();
    }
  }
);

tokenApp.post("/createlogin", async (req, res) => {
  const database = (await connection).db('ticketdb');
  const userTest = await database.collection('client_users').findOne({'email': req.body.email});
  if (!userTest)
  {
    console.log("Email not found, ok creating new")
    req.body.last_active = new Date();
    await (await database.collection('client_users').insertOne(req.body)).insertedId.toString();

    res.status(200);
    res.send();

  } else {
    console.log("Email exist, sending error");
    res.status(409).end();
  }
});

tokenApp.post("/login", async (req, res) => {
  const database =(await connection).db('ticketdb');
  const userCred = await database.collection('client_users').findOne({email: req.body.username})
  if (userCred && userCred.id2 === req.body.password) {
    console.log("authentication OK");

    const user = {
      id: userCred._id.toString(),
      username: userCred.email,
      name: `${userCred.first_name} ${userCred.last_name}`
    };

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
    res.json({ token });

  } else {
    console.log("wrong credentials");
    res.status(401).end();
  }
});

//---------------------------------------------------------------------------
//-----------------------------------Token-----------------------------------
//---------------------------------------------------------------------------

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

//---------------------------------------------------------------------------
//---------------------------------Websocket---------------------------------
//---------------------------------------------------------------------------

const io = new Server(httpServer, {
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
  
  io.on("connection", (socket) => {
    const req = socket.request;
  
    socket.join(`user:${req.user.id}`);
  
    socket.on("whoami", (cb) => {
      cb(req.user.username);
    });
    socket.on("headers", (cb) => {
      cb(ticketList);
    });
    socket.on("details", (id, cb) => {
      cb(GetTicketDetails(id));
    });
    socket.on('pushStatus', (data) => {
      //pushStatus(data);
    });
    socket.on('pushMessage', (data, cb) => {
      cb(postMessage(data));
    });
      
  });

httpServer.listen(port, () => {
  console.log(`application is running at: http://localhost:${port}`);
});

//---------------------------------------------------------------------------
//---------------------------------Database----------------------------------
//---------------------------------------------------------------------------


// use when starting application locally
const mongoUrlLocal = "mongodb://admin:password@localhost:27017";

// use when starting application as docker container
const mongoUrlDocker = "mongodb://admin:password@mongodb";

const mongoClient = new MongoClient(mongoUrlLocal);

const connection = mongoClient.connect();


//const dbconnection = mongoConnect();
