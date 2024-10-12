import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from 'cors';

import {GetTicketDetails, pushMessage, pushStatus, ticketList} from './debugData.js';

const port = process.env.PORT || 3000;
const jwtSecret = "Mys3cr3t";

const app = express();
const httpServer = createServer(app);

app.use(bodyParser.json());
app.use(cors({origin: "*"}));

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.get(
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

app.post("/login", (req, res) => {
  if (req.body.username === "muppet" && req.body.password === "master") {
    console.log("authentication OK");

    const user = {
      id: 1,
      username: "muppet",
    };

    const token = jwt.sign(
      {
        data: user,
      },
      jwtSecret,
      {
        issuer: "accounts.examplesoft.com",
        audience: "yoursite.net",
        expiresIn: "1h",
      },
    );

    res.json({ token });
  } else {
    console.log("wrong credentials");
    res.status(401).end();
  }
});

const jwtDecodeOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
  issuer: "accounts.examplesoft.com",
  audience: "yoursite.net",
};

passport.use(
  new JwtStrategy(jwtDecodeOptions, (payload, done) => {
    return done(null, payload.data);
  }),
);

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
      pushStatus(data);
    });
    socket.on('pushMessage', (data, cb) => {
      cb(pushMessage(data));
    });
      
  });

httpServer.listen(port, () => {
  console.log(`application is running at: http://localhost:${port}`);
});


