const { MongoClient } = require('mongodb');
const { constantes } = require('../data/constants')
const { username, password, database, cluster, collName} = constantes ;

async  function main(){

    const uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
    // "mongodb+srv://<username>:<password>@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";    

    const client = new MongoClient(uri);

    try {
        await client.connect();

        /*/ 1) Create a Reservation Document (just object)
        console.log( createReservationDoc('Infinite Views',
            [ new Date('2021-12-31'), new Date('2022-01-01')],
            { pricePerNight: 180, specialRequests: 'Late Checkout', breakfastIncluded: true}
        )); //*/

        /*/ 2) Update Listing to include this reservation
        await createReservation(client,
            'leslie@example.com',   //userEmail to find in 'users'
            'Infinite Views',   // name to find in 'listingsAndReviews'
            [ new Date('2021-12-31'), new Date('2022-01-01')],  // Dates to find in 'listingsAndReviews'
            { pricePerNight: 180, specialRequests: 'Late Checkout', breakfastIncluded: true}  //reservation details to store in 'listingsAndReviews'
        ); // */

        // 3) Attempt to create reservation with the same Dates and Place
        await createReservation(client,
            'tom@example.com','Infinite Views',
            [ new Date('2021-12-31'), new Date('2022-01-01')],
            { pricePerNight: 180, specialRequests: 'Late Checkout', breakfastIncluded: true}
        ); //*/

    } catch (error) {
        console.error(error);
    }
    finally {
        await client.close();
    }
}

main().catch(console.error);

async function createReservation(client, userEmail, nameOfListing, reservationDates, reservationDetails ) {

    const usersCollections = client.db(database).collection('users');
    const listingAndReviewsCollections = client.db(database).collection('listingsAndReviews');

    const reservation = createReservationDoc(nameOfListing, reservationDates, reservationDetails);

    //create a session for the transaction
    const session = client.startSession();

    const transactionOptions = {
        readPreference: 'primary', readConcern: { level: 'local'}, writeConcern: { w: 'majority'}
    };

    try {
        const transactionResults = await session.withTransaction( async () => {
            // Operation ONE
            const userUpdateResults = await usersCollections.updateOne( {email:userEmail}, 
                { $addToSet: { reservations: reservation }},
                {session});
            console.log(`${userUpdateResults.matchedCount} document(s) found with the email ${userEmail}`); //Must be 1 or 0
            console.log(`${userUpdateResults.modifiedCount} document(s) was/were updated to include the reservation`); 
            
            //OP TWO: Checks if Listening has conflict with previous reservations and Rollback
            const isListingReservedResults = await listingAndReviewsCollections.findOne(
                {
                    name: nameOfListing, 
                    datesReserved: {$in: reservationDates}
                },
                {session}
            ); 
            // IF DETECT any prev reservation, the Transaction should be abort and any change performed
            if(isListingReservedResults){
                await session.abortTransaction();
                console.error('This listing is already reserved for at least one of the given dates. The reservation could not be created!');
                console.log("Any operation thhat already ocurred as part of this transaction will be rolled back.");
                return;
            }


            //OP THREE: Adds to the listing and Reviews
            const listingAndReviewsUpdateResults = await listingAndReviewsCollections.updateOne(
                { name: nameOfListing },
                { $addToSet: { datesReserved: {$each: reservationDates}}},
                {session}
            );
            console.log(`${listingAndReviewsUpdateResults.matchedCount} document(s) found in the listingsAndReviews collection with the name ${nameOfListing}`);
            console.log(`${listingAndReviewsUpdateResults.modifiedCount} document(s) was/were updated to include the reservation dates.`);
            //END of transaction

        }, transactionOptions);

        // IF transaction was successful (Not empty or null)
        if(transactionResults){
            console.log('The reservation was successfully CREATED');
        }
        else {
            console.log('The transaction was intentionally ABORTED.');
        }
    } catch (e) {
        console.error('The transaction was aborted due to an unexpected error: ', e);
    }
    finally{
        await session.endSession();
    }
}

// 1) Simple Reservation Document
function createReservationDoc(nameOfListing, reservationDates, reservationDetails ){
    let reservation = {
        name: nameOfListing,
        dates: reservationDates
    }

    for(let detail in reservationDetails){
        reservation[detail] = reservationDetails[detail];  //reservation[pricePerNight] = reservationDetails[pricePerNight]; ==  pricePerNight: 180
    }
    return reservation;
}