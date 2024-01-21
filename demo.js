const { MongoClient } = require('mongodb');
/* Importing constants as a file */
const { constantes } = require('./data/constants')
const { username, password, database, cluster, collName} = constantes ;

async  function main(){

    //const uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
    const uri = `mongodb://evalle:testpwd@cluster0-shard-00-03.z01xy.mongodb.net:27017/?ssl=true&replicaSet=atlas-i27anp-shard-0&authSource=admin&retryWrites=true&w=majority`;
    
    console.log(`connecting to ${uri}`);
    const client = new MongoClient(uri);

    try {
        await client.connect();  
        await listDatabases(client);
         /*/ Create a single new listing
         await createListing(client,
            {
                name: "TEST Lovely Loft",
                summary: "A charming loft in Paris",
                bedrooms: 1,
                bathrooms: 1
            }
        ); //*/
    } catch (error) {
        console.error(error);
    }
    finally {
        await client.close();
    }
}

main().catch(console.error); //<== CALLING MAIN APP

/**
 * Create a new Airbnb listing
 * @param {MongoClient} client A MongoClient that is connected to a cluster with the sample_airbnb database
 * @param {Object} newListing The new listing to be added
 */
async function createListing(client, newListing){
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#insertOne for the insertOne() docs
    const result = await client.db("").collection(" ").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();
    console.log('Databases:');
    databasesList.databases.forEach(db => {
        console.log(`- ${db.name}`);
    });
}