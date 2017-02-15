var MongoClient = require('mongodb').MongoClient;
var Promise = require('promise');
// Connection URL 
var url = 'mongodb://161.246.6.155:27017/vutlan',
	mylib = require("./controllers/mylib"),
	contents = {"MID":"44741","USERNAME":"guest","AUTHPASSWORD":"vutlan1234","PRIVPASSWORD":"vutlan1234","HOSTIP":"161.246.6.95"};


//	console.log(alert1);



// Use connect method to connect to the Server 
MongoClient.connect(url, function(err, db) {
  	console.log("Connected correctly to server");
  	dataToServer(db).then(function(res){
  		db.close();
  		console.log(res);
  	});
});
var dataToServer = function(db){
	return new Promise(function(resolve, reject){
	  	findDocumentsPM(db, 'monitors').then(function(docs){
	  		docs.forEach(function(doc){
	  			if(typeof doc.ip === "string" ){
	  				// console.log(doc);
	  				// console.log("eee");
		  			var cnt = contents;
		  			cnt["USERNAME"] = doc.username;
		  			cnt["AUTHPASSWORD"] = doc.authPassword;
		  			cnt["PRIVPASSWORD"] = doc.privPassword;
		  			cnt["HOSTIP"] = doc.ip;
		  			// console.log(cnt);
		  			getSensor(cnt).then(function(res){
		  				console.log(res);
		  				updateDocument(db, 'monitors',
		 					{ _id:doc._id },
		 					{
		 						$set: {
		 							name: res.name,
		 							sensors: res.sensors
		 						}
		 					},
		 					function(err,res){
		 						if(err) reject(err);
		 						else resolve("succuss");
		 					});
	  				},function(err){
	  					reject(err);
	  				});
	  			}
	  		});
	  	},function(error){
	  		reject(error);
	  	});
	});
}

var getSensor = function(cnt){
	return new Promise(function(resolve, reject){
		mylib.getSensorTable(cnt, function(err, res){
  			// console.log(res);		
 			if(err) reject(err);
 			else resolve(res);
		});
	});
}

var findDocumentsPM = function(db, clt) {
  	// Get the documents collection 
  	var collection = db.collection(clt);
  	return new Promise(function(resolve, reject){
	  	// Find some documents 
	  	collection.find({}).toArray(function(err, docs) {
	  		if(err) reject(err);
	  		else{
		    	console.log("Found the following records");
		    	// console.dir(docs);
		    	resolve(docs);
		    }
	  	});
	});
}



var closeDB = function(db){
	if(count==0){
		db.close();
	}
}

var insertDocuments = function(db, collection, doc, callback) {
  // Get the documents collection 
  var collection = db.collection('monitors');
  // Insert some documents 
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    console.log("Inserted 3 documents into the document collection");
    callback(result);
  });
}

var updateDocument = function(db, collection, $query,$project, callback) {
  // Get the documents collection 
  var collection = db.collection(collection);
  // console.log($query);
  // console.log($project);
  // Update document where a is 2, set b equal to 1 
  collection.updateOne($query
    , $project , function(err, result) {
    	if(err) callback(err,null);
    	else {
    		console.log("Updated complete");
    		callback(null, result);
    	}
  });  
}

var deleteDocument = function(db, callback) {
  // Get the documents collection 
  var collection = db.collection('documents');
  // Insert some documents 
  collection.deleteOne({ a : 3 }, function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Removed the document with the field a equal to 3");
    callback(result);
  });
}

var findDocuments = function(db, collection, callback) {
  // Get the documents collection 
  var collection = db.collection(collection);
  // Find some documents 
  collection.find({}).toArray(function(err, docs) {
    console.log("Found the following records");
    // console.dir(docs);
    callback(docs);
  });
}