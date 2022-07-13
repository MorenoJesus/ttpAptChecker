//Get Twilio SID and Auth Token from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid) console.error('Twilio account SID not found!!!');
if (!authToken) console.error('Twilio auth token not found!!!');
if (!twilioPhoneNumber) console.error('Twilio phone number not found!!!')

const client = require('twilio')(accountSid, authToken);
const axios = require('axios');

async function getApptAvailability(enrollmentCenterId) {
    let appData = null;
    let runTime = new Date().toLocaleString();
    try {
        const response = await axios.get('https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=1&locationId=' + enrollmentCenterId + '&minimum=1');
        if (response.data && response.data.length > 0) {
            appData = response.data;
            //appData.map((apptData) => console.log(appData));
            return appData
        } else {
            console.log("Ran at: " + runTime);
            console.log('No appointments found.');
        }
    } catch (error) {
        console.error(error);
        return appData;
    }
}

async function getLocationInfo(locationId) {
    let responseData = null;
    try {
        //If this URL no longer works then the postman mock api has been removed. 
        const response = await axios.get('https://253ae628-2ab2-4417-a3aa-aa23418f3957.mock.pstmn.io/schedulerapi/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=Global Entry');
        if (response.data && response.data.length > 0) {
            responseData = response.data.find((location) => location.id === locationId);
            return responseData
        }
    }
    catch (error) {
        console.error(error);
        return responseData;
    }

}

async function notifyUserSMS(apptInfo) {
    client.messages
        .create({
            body: apptInfo,
            //The twilio number is the number twilio will assign to you when you sign up for a dev account.
            from: twilioPhoneNumber,
            //The to number should be your authorized twilio number. E.g. your cell number.
            to: '+11111111111'
        })
        .then(message => console.log(message.sid));
}

async function checkApptAvailability(enrollmentCentersIds) {
    await Promise.all(enrollmentCentersIds.map(async (enrollmentCenterId) => {
        let apptInfo = await getApptAvailability(enrollmentCenterId);
        if (apptInfo) {
            let availDate = null;
            let locationId = null;
            apptInfo.map((info) => {
                console.log('Raw start time stamp: ' + info.startTimestamp);
                let apptDate = new Date(info.startTimestamp)
                availDate = new Date(apptDate).toLocaleString()
                locationId = info.locationId;
            });
            let locationInfo = await getLocationInfo(locationId);
            let msg = `An open appointment was found for ${availDate} at the ${locationInfo.name}.`;
            console.log(msg);
            notifyUserSMS(msg);
        };
    }));
}

module.exports = checkApptAvailability();