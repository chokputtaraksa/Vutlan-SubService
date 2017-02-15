var mylib = require("./controllers/mylib");
	request = require('request');
	autorun = require('./autorun.js')
	fs = require('fs');
	crypto = require('crypto');
	systems = "./systems/Security.json";
// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

var contents = fs.readFileSync(systems); //save all secret data
var jsonContent = JSON.parse(contents);
// console.log(jsonContent);
// console.log(jsonContent);
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8001;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

router.post('/set', function(req, res){
	var setting = req.body;
	console.log(setting);
	var monitor;
//	console.log("content");
//	console.log(jsonContent);
	for(i=0; i<jsonContent.monitors.length; i++){
		if(jsonContent.monitors[i].HOSTIP == setting.addr){
			monitor = jsonContent.monitors[i];
		}
		//console.log(jsonContent.monitors[i]);
	}
	//console.log(monitorID);
	mylib.setSensorbyId(monitorID, setting, function(err,response){
	
		if(err) return err;
		res.sendStatus(204);
	});

});

router.post('/addmonitor', function(req, res){
	var setting = req.body;
	console.log(setting);
	var secureWrite;
	if(setting.addMonitor!=null){
		for(x in jsonContent.monitors){
			if(jsonContent.monitors[x].HOSTIP == setting.addMonitor.HOSTIP){
				res.send("Duplicate IP-Address");
				return;
			}
		}
		secureWrite = {
			USERNAME:setting.addMonitor.USERNAME,
			AUTHPASSWORD:setting.addMonitor.AUTHPASSWORD,
			PRIVPASSWORD:setting.addMonitor.PRIVPASSWORD,
			HOSTIP:setting.addMonitor.HOSTIP
		};
		fs.readFile(systems,function(err,content){
		  	if(err) throw err;
		  	var parseJson = JSON.parse(content);
		   	parseJson.monitors.push(secureWrite);
		   	// console.log(parseJson.monitors);
		  fs.writeFile(systems,JSON.stringify(parseJson),function(err){
		    if(err) throw err;
		    res.send(204);
		  });
		});
	}else{
		res.status(400).send("Wrong JSON-Format");
		return;
	}

});

router.post('/fbsms', function(req, res){
    var event1 = req.body;
    console.log(typeof event1);
    if(event1.fbsms!=null){
    	jsonA = event1.fbsms;
    	var messages = {text:jsonA.state+"!!!"+" at MID "+jsonA.MID+" Name: "+jsonA.mName+" sensorID: "+jsonA.sID+" SensorName: "+jsonA.sName+" value: "+jsonA.value};
    	sendMessage(1032903763477591, messages);
    	res.send("OK");

    }
 });


// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

function postTo(url, object, callback){

	options = {
      	method: 'POST',
      	url: url,
      	header: {
      		"content-type":"application/json",
      	},
      	body: object,
      	json: true,   // <--Very important!!!
	}
	request(options, function (error, response, body){
	  	if (error) throw new Error(error);
	  	console.log(body);
  	});
}


function randomMID(len){
	do{
		var ok = 0;
		var hex = crypto.randomBytes(Math.ceil(len/2))
	        .toString('hex') // convert to hexadecimal format
	        .slice(0,len);
	    var dec = parseInt(hex, 16).toString().slice(0,len);
	    for(i in jsonContent.monitors){
	    	if(jsonContent.monitors[i].MID == dec){
	    		ok = 1;
	    	}
	    }
	}while(ok != 0);
    return dec;

}



// var senderID = [1032903763477591, 757088977780046];
// var word = {text: "Messages: HelloWorld"}
// sendMessage(senderID[0], word);
// sendMessage(senderID[1], word);


// generic function sending messages
function sendMessage(recipientId, message) {
    var token = "EAAXl1QAx7GwBAKw7GHO2gLoSQiBcBmv2UCZBlQmJcdFxFvXwu3L2GVZBt6ZBN9ADmMLPoUH7vkMDk5mpKjfb85AJaHT3mU8sEZAHaBSkZAkfhnr32Qfm1xJTRyNi2Ej3azCHZAbXugZCSXoeVc8vzdrDH7ZAQwK7f8oZBZAMC5ZARg8DQZDZD";
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        // console.log(body);
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};
