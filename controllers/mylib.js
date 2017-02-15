var exec = require('child_process').exec;
    Monitor = require('../models/monitor.js');
    Sensor = require('../models/sensor.js');
    AnalogData = require('../models/analogData.js');

//snmptable -u guest -l authPriv -a MD5 -x DES -A vutlan1234 -X vutlan1234 -Ci -Cb -v3 -cread 161.246.6.95 VUTLAN-SYSTEM-MIB::ctlUnitModulesTable

/* Report status of request */

exports.json_success = function (data) {
    return { "STATUS": "OK", "MSG": "", "DATA": data };
}

exports.json_error = function (msg) {

    return { "STATUS": "ERROR", "MSG": wording.getWord(msg) };
}

exports.json_error_msg = function (msg) {

    return { "STATUS": "ERROR", "MSG": msg};
}

/* Get table and set function */

exports.getSensorTable = function(reqJson, callback){
    // console.log(reqJson);
    // console.log(getUTCTime()+"\n");
	var query = {
		username : reqJson.USERNAME,
		authpassword : reqJson.AUTHPASSWORD,
		privpassword : reqJson.PRIVPASSWORD,
		hostip : reqJson.HOSTIP
	};

	// console.log(query.username);
	exec('snmptable -u ' + query.username + ' -l authPriv -a MD5 -x DES -A '+ query.authpassword+ ' -X ' + 
		query.privpassword + ' -Ci -Cb -v3 -cread '+ query.hostip +' VUTLAN-SYSTEM-MIB::ctlUnitElementsTable', 
		function(error, stdout) {
            // console.log(error);
    	if(error){
    		callback('Timeout', null);
    	}else{
    		var dataset = getTableJSON(stdout);
            var monitorObj = createMonitorJSON(dataset, dataset.length, query.hostip);
            // console.log(dataset.length);
            callback(null,monitorObj)
            // console.log(getUTCTime()+"\n");
    	}
	});
}

exports.getAnalogsTable = function(reqJson, callback){
    // console.log(reqJson);
    var query = {
        username : reqJson.USERNAME,
        authpassword : reqJson.AUTHPASSWORD,
        privpassword : reqJson.PRIVPASSWORD,
        hostip : reqJson.HOSTIP
    }
    getInternalAnalogSensors(query.username, query.authpassword, query.privpassword, query.hostip, function(err,res){
        if(err) callback('Timeout',null);
        else {
            // console.log(res);;
            var dataset = getTableJSON(res);
            var analogObj = createAnalogJSON(dataset, dataset.length, query.hostip)
            // console.log(analogObj);
            // callback(null,dataset);
        }
    });
}

function getTableJSON(data){
    var datas = data.split('\n');
    datas.splice(0,3);
    datas.splice(datas.length-1, datas.length);
    // var row = datas.length;
    // console.log(datas);
    var dataset = [[],[]];
    for(i=0; i<datas.length; i++){
        dataset[i] = datas[i].match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g);
        for(j in dataset[i]){
            dataset[i][j] = dataset[i][j].replace(/"/g, "");
        }
    }
    // console.log(dataset)
    // var monitorJSON = createJSON(dataset, row, mid)
    return dataset;
}

function createMonitorJSON(input, dataRow, mid){
    // console.log(input[12].length);
    var monitor;
    var sensors = [];
    for(i=dataRow-1; i>=0 ; i--){
        // console.log(input[i]);
        if(i==0){ //1st row is monitor information
            monitor = new Monitor(mid, input[i][7], getUTCTime(), sensors);
        }else{
            if(input[i][8]!="\"unknown\""){
                // console.log(input[i][8]);
                sensors.push(new Sensor(input[i][0],input[i][1],input[i][2],input[i][3],input[i][4],input[i][5],input[i][6],input[i][7],input[i][8],input[i][9],input[i][10]));
            }
        }
    }
    // var monitorJSON = JSON.stringify(monitor);
    return monitor;
}

function createAnalogJSON(input, dataRow, mid){
    var analogData = [];
    for(i=dataRow-1; i>=0 ; i--){
        // console.log(input[i][8]);
        analogData.push(new AnalogData(mid,input[i][1],input[i][4],input[i][5],input[i][8],input[i][9],input[i][10],input[i][11],input[i][12],input[i][13],input[i][14],input[i][15],input[i][16]));
    }
    // var monitorJSON = JSON.stringify(monitor);
    return analogData;
}

function getUTCTime(){
    var now = new Date();
    var ym = now.toISOString().substr(0,7);
    var date = now.getDate();
    var hour = now.getHours();
    if(hour<10) hour = "0"+hour;
    var minute = now.getMinutes();
    if(minute<10) minute = "0"+minute;
    var second = now.getSeconds();
    if(second<10) second = "0"+second;
    return ym+"-"+date+"T"+hour+":"+minute+":"+second+"+07:00"
}


exports.setSensorbyId = function(monitorData, setData, callback){
	var query = {
        username : monitorData.USERNAME,
        authpassword : monitorData.AUTHPASSWORD,
        privpassword : monitorData.PRIVPASSWORD,
        hostip : monitorData.HOSTIP,
    };
    var setting = {
        sid : setData.sid,
        sclass : setData.class,
        setName : setData.set.name,
        setLowAlarm : setData.set.lowAlarm,
        setLowWarning : setData.set.lowWarning,
        setHighWarning : setData.set.highWarning,
        setHighAlarm : setData.set.highAlarm,
        setAt0 : setData.set.at0,
        setAt75 : setData.set.at75,
        setInitState : setData.set.initial,
        setPulse : setData.set.pulse
    }
    if(setting.sclass =='analog'){
        if(setting.setName != null){
            setInternalSensorsAnalog("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);
            setCANSensorsAnalog("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);
            setRsSensorsAnalog("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);
        }
        if(setting.setLowAlarm != null){
            setInternalSensorsAnalog("LowAlarm", setting.sid, setting.setLowAlarm, query.username, query.authpassword, query.privpassword, query.hostip);     
            setCANSensorsAnalog("LowAlarm", setting.sid, setting.setLowAlarm, query.username, query.authpassword, query.privpassword, query.hostip);     
            setRsSensorsAnalog("LowAlarm", setting.sid, setting.setLowAlarm, query.username, query.authpassword, query.privpassword, query.hostip);     
        
        }
        if(setting.setLowWarning != null){
            setInternalSensorsAnalog("LowWarning", setting.sid, setting.setLowWarning, query.username, query.authpassword, query.privpassword, query.hostip); 
            setCANSensorsAnalog("LowWarning", setting.sid, setting.setLowWarning, query.username, query.authpassword, query.privpassword, query.hostip); 
            setRsSensorsAnalog("LowWarning", setting.sid, setting.setLowWarning, query.username, query.authpassword, query.privpassword, query.hostip); 
        }
        if(setting.setHighWarning != null){
            setInternalSensorsAnalog("HighWarning", setting.sid, setting.setHighWarning, query.username, query.authpassword, query.privpassword, query.hostip);     
            setCANSensorsAnalog("HighWarning", setting.sid, setting.setHighWarning, query.username, query.authpassword, query.privpassword, query.hostip);     
            setRsSensorsAnalog("HighWarning", setting.sid, setting.setHighWarning, query.username, query.authpassword, query.privpassword, query.hostip);     
        
        }
        if(setting.setHighAlarm != null){
            setInternalSensorsAnalog("HighAlarm", setting.sid, setting.setHighAlarm, query.username, query.authpassword, query.privpassword, query.hostip);   
            setCANSensorsAnalog("HighAlarm", setting.sid, setting.setHighAlarm, query.username, query.authpassword, query.privpassword, query.hostip);   
            setRsSensorsAnalog("HighAlarm", setting.sid, setting.setHighAlarm, query.username, query.authpassword, query.privpassword, query.hostip);   
        
        }
        if(setting.setAt0 != null){
            setInternalSensorsAnalog("At0", setting.sid, setting.setAt0, query.username, query.authpassword, query.privpassword, query.hostip);     
            setCANSensorsAnalog("At0", setting.sid, setting.setAt0, query.username, query.authpassword, query.privpassword, query.hostip);     
            setRsSensorsAnalog("At0", setting.sid, setting.setAt0, query.username, query.authpassword, query.privpassword, query.hostip);     
        
        }
        if(setting.setAt75 != null){
            setInternalSensorsAnalog("At75", setting.sid, setting.setAt75, query.username, query.authpassword, query.privpassword, query.hostip);     
            setCANSensorsAnalog("At75", setting.sid, setting.setAt75, query.username, query.authpassword, query.privpassword, query.hostip);     
            setRsSensorsAnalog("At75", setting.sid, setting.setAt75, query.username, query.authpassword, query.privpassword, query.hostip);     
        
        }
    }else if(setting.sclass == 'switch'){
        if(setting.setName != null){
            setInternalSensorsOutlet("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);    
            setCANSensorsOutlet("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);    
            setRsSensorsOutlet("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);    
        
        }
        if(setting.setInitState != null){
            setInternalSensorsOutlet("Initial", setting.sid, setting.setInitState, query.username, query.authpassword, query.privpassword, query.hostip);    
            setCANSensorsOutlet("Initial", setting.sid, setting.setInitState, query.username, query.authpassword, query.privpassword, query.hostip);    
            setRsSensorsOutlet("Initial", setting.sid, setting.setInitState, query.username, query.authpassword, query.privpassword, query.hostip);    
        
        }
        if(setting.setPulse != null){
            setInternalSensorsDiscret("Pulse", setting.sid, setting.setPulse, query.username, query.authpassword, query.privpassword, query.hostip);    
            setCANSensorsDiscret("Pulse", setting.sid, setting.setPulse, query.username, query.authpassword, query.privpassword, query.hostip);    
            setRsSensorsDiscret("Pulse", setting.sid, setting.setPulse, query.username, query.authpassword, query.privpassword, query.hostip);    
        
        }
    }else if(setting.sclass == 'discrete'){
        if(setting.setName != null){
            setInternalSensorsDiscret("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);    
            setCANSensorsDiscret("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);    
            setRsSensorsDiscret("Name", setting.sid, setting.setName, query.username, query.authpassword, query.privpassword, query.hostip);    
        
        }
    }
	callback(null, "200");
}

/* all function in the monitor */

function getUnitModules(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlUnitModulesTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

function getUnitGroup(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlUnitGroupsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

function getNotifyMailers(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlNotifiersMailersTable', function(error, stdout) {
    	if(error){3 -crea
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

function getNotifyTraps(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlNotifiersTrapsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

function getNotifySMSs(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlNotifiersSMSsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlVirtualDevicesTimersTable
function getVDTimers(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlVirtualDevicesTimersTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlVirtualDevicesPingsTable
function getVDPings(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlVirtualDevicesPingsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlVirtualDevicesTriggersTable
function getVDTriggers(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlVirtualDevicesTriggersTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlVirtualDevicesSnmpgetsTable
function getVDSnmpgets(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlVirtualDevicesSnmpgetsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlHardwareDevicesCamerasTable
function getHWCameras(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlHardwareDevicesCamerasTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlInternalSensorsDiscretsTable
function getInternalSensorsDiscrets(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlInternalSensorsDiscretsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlInternalSensorsOutletsTable : get internal relay state
function getInternalSensorsOutlets(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlInternalSensorsOutletsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

function getUnitLogics(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlUnitLogicsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlCANSensorsDiscretsTable
function getCANSensorsDiscrets(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlCANSensorsDiscretsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlCANSensorsOutletsTable
function getCANSensorsOutlets(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlCANSensorsOutletsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
//ctlRsSensorsDiscretsTable
function getRsSensorsDiscrets(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlRsSensorsDiscretsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

/* All element in table */
function getUnitElements(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlUnitElementsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

/* Internal Sensor table */
function getInternalAnalogSensors(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlInternalSensorsAnalogsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

function getCANSensors(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlCANSensorsAnalogsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

//ctlRsSensorsAnalogsTable
function getRSSensors(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlRsSensorsAnalogsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}
/* ctlRsSensorsOutletsTable Outlet(relay) */
function getRSSensorsOutlets(username, authenpassword, privpassword, hostip, callback){
	exec('snmptable -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword
		+ ' -X ' + privpassword + ' -Ci -Cb -v3 -cread '+ hostip +' VUTLAN-SYSTEM-MIB::ctlRsSensorsOutletsTable', function(error, stdout) {
    	if(error){
    		callback(error, null);
    	}else{
    		callback(null, stdout);
    	}
	});
}

/*                   Set one device by id                       */
//SettingType : Thing that will be setting(Name)
function setUnitModule(settingType, deviceId, settingValue, usernameName, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlUnitModule' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}

// snmpset -u guest -l authPriv -a MD5 -x DES -A vulan1234 -X vutlan1234 -v3 -cwrite 161.246.6.95 VUTLAN-SYSTEM-MIB::ctlUnitGroupName.201004 = "Hello" 
//SettingType : Thing that will be setting(Name, Desc)
function setUnitGroup(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlUnitGroup' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Group, Name)
function setUnitElement(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlUnitElement' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Desc, Disable, RowStatus)
function setUnitLogic(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlUnitLogic' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Server, Port, Login, Password, To, From, Message)
function setNotifiersMailer(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlNotifiersMailer' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Server, Port, Version, Community)
function setNotifiersTrap(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlNotifiersTrap' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, To, Message)
function setNotifiersSMS(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlNotifiersSMS' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Begin, End, Days, Mode)
function setVirtualDevicesTimers(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlVirtualDevicesTimers' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Period, RTT, Server)
function setVirtualDevicesPing(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlVirtualDevicesPing' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Reverse)
function setVirtualDevicesTrigger(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlVirtualDevicesTrigger' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Period, Server, Port, Community, Oid, Vartype, LowAlarm, LowWarning
//										  	HighWarning, HighAlarm, Expression)
function setVirtualDevicesSnmpget(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlVirtualDevicesSnmpget' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, URL, FPS, Resolution)
function setHardwareDevicesCamera(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlHardwareDevicesCamera' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Reset, Level, Reverse)
function setInternalSensorsDiscret(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlInternalSensorsDiscret' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, LowAlarm, LowWarning, HighWarning, HighAlarm, At0, At75, Expression)
function setInternalSensorsAnalog(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlInternalSensorsAnalog' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
// SettingType : Thing that will be setting(Name, Value[0,1], Initial[on,off], Pulse[0-9])
function setInternalSensorsOutlet(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlInternalSensorsOutlet' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Reset, Level, Reverse)
function setCANSensorsDiscret(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlCANSensorsDiscret' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, LowAlarm, LowWarning, HighWarning, HighAlarm, At0, At75, Expression)
function setCANSensorsAnalog(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlCANSensorsAnalog' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Initial, Pulse)
function setCANSensorsOutlet(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlCANSensorsOutlet' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Reset, Level, Reverse)
function setRsSensorsDiscret(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlRsSensorsDiscret' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, LowAlarm, LowWarning, HighWarning, HighAlarm, At0, At75, Expression)
function setRsSensorsAnalog(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlRsSensorsAnalog' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
//SettingType : Thing that will be setting(Name, Value, Initial, Pulse)
function setRsSensorsOutlet(settingType, deviceId, settingValue, username, authenpassword, privpassword, hostip){
	exec('snmpset -u ' + username + ' -l authPriv -a MD5 -x DES -A '+ authenpassword+ ' -X ' + privpassword 
		+ ' -v3 -cwrite '+ hostip +' VUTLAN-SYSTEM-MIB::ctlRsSensorsOutlet' + settingType + '.' + 
		deviceId + ' = \"' +  settingValue + '\"', function(error, stdout) {
    	if(error){
    		// console.log("Setting error: " + error);
    	}else{
    		console.log("Setting complete. " + settingType +" is: " + settingValue);
    	}
	});
}
