import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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

//-------------------------
//--------API server-------
//-------------------------

const tokenApp = express();
const httpServer = createServer(tokenApp);
const users = [];

tokenApp.use(bodyParser.json());
tokenApp.use(cors({origin: "*"}));

const __dirname = dirname(fileURLToPath(import.meta.url));


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

tokenApp.get(
  "/headers",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user) {
      try{
      const database =(await connection).db('ticketdb');
      const heads = await database.collection('ticket_heads').find({"owner": ObjectId.createFromHexString(req.user.id)}).toArray()
      res.send({data: heads});
      setReadStatus(ticketList);
    }
    catch (err) { console.log(err) };
    } else {
      res.status(401).end();
    }
  },
);

tokenApp.get(
  "/details/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user) {
      try{
        const database =(await connection).db('ticketdb');
        const details = await database.collection('ticket_details').findOne(ObjectId.createFromHexString(req.params.id));
        /*console.log("begin")
        console.log(details)
        console.log("end")*/
        res.send(details);
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
  (req, res) => {
    if (req.user) {
      postMessage(req.body);
      res.send(GetTicketDetails(req.params.id));
    } else {
      res.status(401).end();
    }
    sendtest();
  }
);

tokenApp.post("/login", async (req, res) => {
  const database =(await connection).db('ticketdb');
  const userCred = await database.collection('client_users').findOne({"last_name": 'Mupp'})
  if (userCred && userCred.id2 === req.body.password) {
    console.log("authentication OK");

    const user = {
      id: userCred._id.toString(),
      username: userCred.last_name,
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

//-------------------------
//----------Token----------
//-------------------------

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

//-------------------------
//--------Websocket--------
//-------------------------

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

//-------------------------
//--------Database---------
//-------------------------


// use when starting application locally
const mongoUrlLocal = "mongodb://admin:password@localhost:27017";

// use when starting application as docker container
const mongoUrlDocker = "mongodb://admin:password@mongodb";

const databaseName = "ticketdb";

const mongoClient = new MongoClient(mongoUrlLocal);

const connection = mongoClient.connect();

async function sendtest() {
  try{
    const database =(await connection).db('ticketdb');
    const result = await database.collection('ticket_heads').insertMany([{name: 'mupp'}])
      console.log(result.insertedIds['0']);
    return result;
  }
  catch (err) { console.log(err) };
}

//const dbconnection = mongoConnect();
