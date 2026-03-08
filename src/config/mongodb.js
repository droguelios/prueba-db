const { MongoClient } = require('mongodb');

require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URI);

async function connectMongo() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    return client.db("db_megastore_examn");
}

module.exports = { connectMongo };