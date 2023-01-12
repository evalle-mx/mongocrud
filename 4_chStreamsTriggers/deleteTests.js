const { MongoClient, ObjectId } = require('mongodb');
//Obtain values from another file
const { constantes } = require('../data/constants')
const { username, password, database, cluster, collName} = constantes ;

async  function main(){

    const uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;   

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const ids = ['63c019f22358dad48684c334', '63c019f22358dad48684c335'];

        // ids.forEach( el => {
        //     console.log(el);
        // })

        await deleteListing(client, new ObjectId('63c019f22358dad48684c335') );
        
    } catch (error) {
        console.error(error);
    }
    finally {
        await client.close();
    }
}

main().catch(console.error); //<== CALLING MAIN APP

/*
* Delete an Airbnb listing
* @param {MongoClient} client A MongoClient that is connected to a cluster with the sample_airbnb database
* @param {String} listingId The id of the listing you want to delete
*/
async function deleteListing(client, listingId) {
   // See http://bit.ly/Node_deleteOne for the deleteOne() docs
   const result = await client.db("sample_airbnb").collection("listingsAndReviews").deleteOne({ _id: listingId });

   console.log(`${result.deletedCount} document with id ${listingId} was/were deleted.`);
}