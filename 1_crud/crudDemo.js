const { MongoClient } = require('mongodb');

async  function main(){

    const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";

    const client = new MongoClient(uri);

    try {
        await client.connect();  
               
        // await deleteListingByName(client, 'Cozy Cottage');
        await deleteListingsScrapedBeforeDate(client, new Date("2019-02-15"));

    } catch (error) {
        console.error(error);
    }
    finally {
        await client.close();
    }
}

main().catch(console.error);

async function deleteListingsScrapedBeforeDate(client, date) {
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#deleteMany for the deleteMany() docs
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").deleteMany({ "last_scraped": { $lt: date } });
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}

async function deleteListingByName(client, nameOfListing) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews")
        .deleteOne({ name: nameOfListing });

    console.log(`${result.deletedCount} document(s) was/were deleted`);
}

/* List databases on Cluster */
async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();
    console.log('Databases:');
    databasesList.databases.forEach(db => {
        console.log(`- ${db.name}`);
    });

}