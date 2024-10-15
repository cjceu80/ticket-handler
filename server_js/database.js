import { MongoClient } from "mongodb";

// use when starting application locally
let mongoUrlLocal = "mongodb://admin:password@localhost:27017";

// use when starting application as docker container
let mongoUrlDocker = "mongodb://admin:password@mongodb";

// pass these options to mongo client connect request to avoid DeprecationWarning for current Server Discovery and Monitoring engine
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };

// "user-account" in demo with docker. "my-db" in demo with docker-compose
let databaseName = "ticketdb";

MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
  if (err) throw err;

  let db = client.db(databaseName);
  userObj['userid'] = 1;

  let myquery = { userid: 1 };
  let newvalues = { $set: userObj };

  db.collection("users").updateOne(myquery, newvalues, {upsert: true}, function(err, res) {
    if (err) throw err;
    client.close();
  });

});