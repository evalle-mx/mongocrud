const { MongoClient } = require('mongodb');

//Obtainind values from another file
const { constantes } = require('./constants')
const { username, password, database, cluster, collName} = constantes ;

async  function main(){

    const uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
    // "mongodb+srv://<username>:<password>@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";    

    const client = new MongoClient(uri);

    try {
        await client.connect();  
        //await listDatabases(client);
        await printCheapestSuburns(client, 'Australia', 'Sydney', 10)
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

//I) Filter: 1 bedroom listing, Sydney Australia's market, room type = 'Entire home / apartment', suburb exists (not empty)
/* query Using Aggregation Pipeline tab in ATLAS UI 
>> $match
 {
    bedrooms:1,
    "address.country":"Australia",
    "address.market":"Sydney",
    "address.suburb":{ $exists: 1, $ne: ""},
    room_type:"Entire home/apt"
  }
*/
//II) Group by Suburb, and obtain Average Price for each group
/*
>> $group
{
  _id: "$address.suburb",
  averagePrice: {
    "$avg": "$price"
  }
}
*/
// III) Sort from the least expensive [1] (Or most expensive [-1])
/*
>> $sort
{
  "averagePrice": 1
}
*/
//IV) Limit to 10 results
/*
>> $limit
  10
*/
async function printCheapestSuburns(client, country, market, maxNumberToPrint) {
    const pipeline = [
        {
          '$match': {
            'bedrooms': 1, 
            'address.country': country, 
            'address.market': market, 
            'address.suburb': {
              '$exists': 1, 
              '$ne': ''
            }, 
            'room_type': 'Entire home/apt'
          }
        }, {
          '$group': {
            '_id': '$address.suburb', 
            'averagePrice': {
              '$avg': '$price'
            }
          }
        }, {
          '$sort': {
            'averagePrice': 1
          }
        }, {
          '$limit': maxNumberToPrint
        }
      ];

      //client.db("sample_airbnb").collection("listingsAndReviews")
    const aggCursor = client.db(database).collection(collName)
        .aggregate(pipeline);
    
    await aggCursor.forEach( airbnbListing => {
        console.log(`${airbnbListing._id}: ${airbnbListing.averagePrice}`);
    })
    
}
