var checker = require('./checker');

const enrollmentCentersIds = [12781, 5002, 5006, 5180];

setInterval(() => checker.checkApptAvailability(enrollmentCentersIds), 300000); //300000 = 5min
