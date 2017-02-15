var mylib = require("./controllers/mylib");
	request = require('request');
	fs = require('fs');
	systems = "./systems/Security.json";
	cluster = require('cluster');
var jsonContent;
setInterval(function(){
	var contents = fs.readFileSync(systems); //save all secret data
	jsonContent = JSON.parse(contents);
},1500);

// for(z in jsonContent.monitors){
// 	mylib.getAnalogsTable(jsonContent.monitors[z], function(err, res){
// 			 console.log(res);
// 			// postTo("http://sensor.project.lenkunz.cf:8000/api/update", res, function(err,resp){
// 			// 	//if(err) console.log(err.body);
// 			// 	console.log(resp);
// 			// });
// 		});

// 	}

setInterval(function(){
	for(z in jsonContent.monitors){
		mylib.getSensorTable(jsonContent.monitors[z], function(err, res){
			 // console.log(res);
			postTo("http://192.168.1.253:8000/api/update", res, function(err,resp){
				// if(err) console.log(err.body);
				console.log(resp);
			});
		});
		// mylib.getAnalogsTable(jsonContent.monitors[z], function(err, res){
		// 	 console.log(res);
		// 	// postTo("http://sensor.project.lenkunz.cf:8000/api/update", res, function(err,resp){
		// 	// 	//if(err) console.log(err.body);
		// 	// 	console.log(resp);
		// 	// });
		// });

	}
//	console.log(alert1);
},5000);
// to alert every 3 minute

// setInterval(function(){

// },180000);


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
	  	if (error) callback(error, null);
	  	else callback(null, body);
  	});
}

// to send data to back-end and database
// console.log(typeof jsonContent);


// var alert1 = [];
// var numWorkers = require('os').cpus().length;
// setInterval(function(){
// 	if(cluster.isMaster) {
// 	    var numWorkers = require('os').cpus().length;

// 	    for(var i = 0; i < numWorkers; i++) {
// 	        cluster.fork();
// 	    }

// 	    cluster.on('online', function(worker) {
// 	        console.log('Worker ' + worker.process.pid + ' is online');
// 	        for(z in jsonContent.monitors){
// 				mylib.getSensorTable(jsonContent.monitors[z], function(err, res){
// 	        		worker.send();
// 	        	}
// 	        }

// 	    });

// 	    cluster.on('exit', function(worker, code, signal) {
// 	        // console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
// 	        // console.log('Starting a new worker');
// 	        cluster.fork();
// 	    });
// 	}else if (cluster.isWorker) {
//   		process.on('message', (msg) => {
//     		process.send(msg);
//   		});
// 	}
// },5500);


// try{
			// 	for(x in res['sensors']){
			// 		if(res['sensors'][x].state == '"warning"' || res['sensors'][x].state  == '"alarm"'){
			// 			var hist = {
			// 				fbsms:{
			// 					MID: res['mid'],
			// 					mName: res['name'],
			// 					sID: res['sensors'][x].sid,
			// 					sName: res['sensors'][x].name,
			// 					state: res['sensors'][x].state,
			// 					value: res['sensors'][x].value
			// 				}
			// 			}
			// 			// console.log(hist);

			// 			if(alert1.length<1){
			// 				alert1.push(hist);
			// 				postTo("http://161.246.6.155:8001/api/fbsms", hist, function(err, resp){
			// 				});
			// 			}else{
			// 				var check = 0;
			// 				for(y in alert1){
			// 					// console.log(alert1[0].fbsms.MID + "   "+ alert1[y].fbsms.sID);
			// 					// console.log(hist.fbsms.MID + "   " + hist.fbsms.sID);
			// 					if(alert1[y].fbsms.MID == hist.fbsms.MID && alert1[y].fbsms.sID == hist.fbsms.sID){
			// 						check =1;
			// 					}
			// 				}
			// 				if(check==0){
			// 					alert1.push(hist);
			// 					postTo("http://161.246.6.155:8001/api/fbsms", hist, function(err, resp){
			// 					});
			// 				}
			// 			}
			// 		}
			// 	}
			// }catch(error) {
			// 	console.log(error);
			// }