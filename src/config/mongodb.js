const {mongoClient} = require ('mongodb');
const client = new 
mongoClient(process.env.mongo_URI);

async function connetmongo(){
    if (!client.topology || ! client.topology()){
        await client.connect();
    }
    return client.db("db_megastore_examn");
}

module.exports = connectMongo;