const { MongoClient } = require('mongodb');
//Obtain values from another file
const { constantes } = require('../data/constants')
const { username, password, database, cluster, collName} = constantes ;
const stream = require('stream');

async  function main(){

    const uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;   

    const client = new MongoClient(uri);

    try {
        await client.connect();


        // This script contains three ways to monitor new listings in the listingsAndReviews collection.
        // Comment in the monitoring function you'd like to use.

        // OPTION ZERO: Monitor new listings using EventEmitter's on() function. (without pipeline)
       // await monitorListingsUsingEventEmitter(client, 15000);

        const pipeline =[
            {
                '$match': {
                    'operationType': 'insert',
                    'fullDocument.address.country': 'Australia',
                    'fullDocument.address.market': 'Sydney'
                }
            }
        ];

        // OPTION ONE: Monitor new listings using EventEmitter's on() function. (without pipeline)
        // await monitorListingsUsingEventEmitter(client, 15000, pipeline);

        // OPTION TWO: Monitor new listings using ChangeStream's hasNext() function
        // await monitorListingsUsingHasNext(client, 15000, pipeline);


        // OPTION THREE: Monitor new listings using the Stream API
        await monitorListingsUsingStreamAPI(client);


        
    } catch (error) {
        console.error(error);
    }
    finally {
        await client.close();
    }
}

main().catch(console.error); //<== CALLING MAIN APP

/**
 * Close the given change stream after the given amount of time
 * @param {*} timeInMs The amount of time in ms to monitor listings
 * @param {*} changeStream The open change stream that should be closed
 */
function closeChangeStream(timeInMs = 60000, changeStream) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Closing the change stream");
            changeStream.close();
            resolve();
        }, timeInMs)
    })
};

/**
 * Monitor listings in the listingsAndReviews collections for changes
 * This function uses the on() function from the EventEmitter class to monitor changes
 * @param {MongoClient} client A MongoClient that is connected to a cluster with the sample_airbnb database
 * @param {Number} timeInMs The amount of time in ms to monitor listings
 * @param {Object} pipeline An aggregation pipeline that determines which change events should be output to the console
 */
async function monitorListingsUsingEventEmitter(client, timeInMs = 60000, pipeline = []) {
    const collection = client.db("sample_airbnb").collection("listingsAndReviews");

    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#watch for the watch() docs
    const changeStream = collection.watch(pipeline);

    // ChangeStream inherits from the Node Built-in Class EventEmitter (https://nodejs.org/dist/latest-v12.x/docs/api/events.html#events_class_eventemitter).
    // We can use EventEmitter's on() to add a listener function that will be called whenever a change occurs in the change stream.
    // See https://nodejs.org/dist/latest-v12.x/docs/api/events.html#events_emitter_on_eventname_listener for the on() docs.
    changeStream.on('change', (next) => {
        console.log(next);
    });

    // Wait the given amount of time and then close the change stream
    await closeChangeStream(timeInMs, changeStream);
}

/**
 * Monitor listings in the listingsAndReviews collections for changes
 * This function uses the hasNext() function from the MongoDB Node.js Driver's ChangeStream class to monitor changes
 * @param {MongoClient} client A MongoClient that is connected to a cluster with the sample_airbnb database
 * @param {Number} timeInMs The amount of time in ms to monitor listings
 * @param {Object} pipeline An aggregation pipeline that determines which change events should be output to the console
 */
async function monitorListingsUsingHasNext(client, timeInMs = 60000, pipeline = []) {
    const collection = client.db("sample_airbnb").collection("listingsAndReviews");

    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#watch for the watch() docs
    const changeStream = collection.watch(pipeline);

    // Set a timer that will close the change stream after the given amount of time
    // Function execution will continue because we are not using "await" here
    closeChangeStream(timeInMs, changeStream);

    // We can use ChangeStream's hasNext() function to wait for a new change in the change stream.
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/ChangeStream.html for the ChangeStream docs.
    try {
        while (await changeStream.hasNext()) {
            console.log(await changeStream.next());
        }
    } catch (error) {
        if (changeStream.closed) {   //isClosed()
            console.log("The change stream is closed. Will not wait on any more changes.")
        } else {
            throw error;
        }
    }
}

/**
 * Monitor listings in the listingsAndReviews collection for changes
 * This function uses the Stream API (https://nodejs.org/api/stream.html) to monitor changes
 * @param {MongoClient} client A MongoClient that is connected to a cluster with the sample_airbnb database
 * @param {Number} timeInMs The amount of time in ms to monitor listings
 * @param {Object} pipeline An aggregation pipeline that determines which change events should be output to the console
 */
async function monitorListingsUsingStreamAPI(client, timeInMs = 60000, pipeline = []) {
    const collection = client.db('sample_airbnb').collection('listingsAndReviews');

    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#watch for the watch() docs
    const changeStream = collection.watch(pipeline);

    // See https://mongodb.github.io/node-mongodb-native/3.6/api/ChangeStream.html#stream for the stream() docs
    changeStream.stream().pipe(
        new stream.Writable({
            objectMode: true,
            write: function (doc, _, cb) {
                console.log(doc);
                cb();
            }
        })
    );

    // Wait the given amount of time and then close the change stream
    await closeChangeStream(timeInMs, changeStream);
}