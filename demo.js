const { MongoClient } = require('mongodb');
const { constantes } = require('./constants')
const { username, password, database, cluster, collName} = constantes ;

async  function main(){

    const uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
    // "mongodb+srv://<username>:<password>@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";    

    const client = new MongoClient(uri);

    try {
        await client.connect();  
        await listDatabases(client);
    } catch (error) {
        console.error(error);
    }
    finally {
        await client.close();
    }
}

main().catch(console.error);

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();
    console.log('Databases:');
    databasesList.databases.forEach(db => {
        console.log(`- ${db.name}`);
    });

}