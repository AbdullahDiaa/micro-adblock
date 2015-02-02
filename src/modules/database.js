/*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
* Copyright (c) 2015, Abdullah Diaa
*/


let database = {
	
	whitelist : {},
	file : dirService.get("ProfD", Ci.nsIFile),
	init: function(){
		// Get whitelist store.json file [migrating data from simple-storage of Addons SDK]
		this.file.append("jetpack");
		this.file.append("jid1-yIDO6R3DGl4u2Q@jetpack");
		this.file.append("simple-storage");
		this.file.append("store.json");
		
		this.whitelist = {};
		
		
		if (!this.file.exists())
		{
			//create store.json if it doesn't exists
			this.file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
			return;
		}
		
		var inputStream = Cc["@mozilla.org/network/file-input-stream;1"]
							.createInstance(Ci.nsIFileInputStream);
		var cstream = Cc["@mozilla.org/intl/converter-input-stream;1"]
						.createInstance(Ci.nsIConverterInputStream);
			
		// input stream
		// read, create
		inputStream.init(this.file, 0x01 | 0x08, 0666, 0);
		cstream.init(inputStream, "UTF-8", 0, 0);
		
		var json = "";
		var data = {};
		while (cstream.readString(-1, data) != 0)
			json += data.value;
		
		if (!json.length)
			return;
	
		var arr = JSON.parse(json);
		
		//Check for any synced whitelist data 
		let synced_whitelist = getSyncedWhiteList();
		
		//Merge synced data
		if(synced_whitelist){
			for (var website in synced_whitelist) {
			  arr.whitelist[website] = true;
			}
		}
		
		if (!arr.whitelist)
			return;
		
		 // convert to map for faster lookup
		for (var website in arr.whitelist) {
		  this.whitelist[website] = true;
		}
		
		// Update synced data
		syncWhitelist(JSON.stringify(this.whitelist));
	},

	record: function(activeWindow){
		if(activeWindow === "") return;
		this.whitelist[activeWindow] = true;
	},
	
	remove: function(activeWindow){
		delete this.whitelist[activeWindow];
	},
	
	isWhitelisted: function(activeWindow){
		if (!this.whitelist[activeWindow]) { return false; }
		return true;
	},
	
	toggle: function(){
		let window = Services.wm.getMostRecentWindow("navigator:browser");
		let activeWindow = window.content.document.location.host;
		
		if(!this.whitelist[activeWindow]){
			this.record(activeWindow);
			return true;
		}else{
			this.remove(activeWindow);
			return false;
		}		
	},
	
	close: function(){
		 // Initialize output stream.
		var outputStream = Cc["@mozilla.org/network/file-output-stream;1"]
							.createInstance(Ci.nsIFileOutputStream);
		// write, create, truncate
		// see https://developer.mozilla.org/en-US/docs/PR_Open#Parameters
		outputStream.init(this.file, 0x02 | 0x08 | 0x20, 0666, 0);
		
		// Convert data to JSON.
		var arr = {"whitelist": {} };
		
		for (var url in this.whitelist)
		{
			arr.whitelist[url] = true;
		}
		
		var jsonString = JSON.stringify(arr);
			
		// Write store.json file 	
		outputStream.write(jsonString, jsonString.length);
		outputStream.close();
		
		this.whitelist = {};
	}
}


// Initialize addon database
database.init();