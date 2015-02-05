/*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
* Copyright (c) 2015, Abdullah Diaa
*/


//Let's define Components objects
const {classes: Cc, interfaces: Ci, utils: Cu, manager: Cm, results: Cr} = Components;

// Import necessary modules
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var dirService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);

// easy and useful helpers for when I'm debugging
XPCOMUtils.defineLazyModuleGetter(this, "console", "resource://gre/modules/devtools/Console.jsm");

function LOG(str) {
	if(!str) { str = typeof(str) + ': ' + str; }
	console.log(' :: MICRO-ADBLOCK :: ' + str);
}

let NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
	BUTTON_ID = "micro-adblock-toolbar-button";

const 	global = this;

// Called when the extension needs to start itself up. This happens at application launch time or when the extension is enabled after being disabled (or after it has been shut down in order to install an update. As such, this can be called many times during the lifetime of the application.
	
function startup(data) AddonManager.getAddonByID(data.id, function(addon) {

	this.addon = addon;
	
	// Load various javascript includes for helper functions
	["prefs", "database", "ui", "policy"].forEach(function(fileName) {
		let fileURI = addon.getResourceURI("modules/" + fileName + ".js");
		Services.scriptloader.loadSubScript(fileURI.spec, global);
	});
	
	windowListener.register();
	
	// Observe Page loads to block ads
	policy.register();	
});


// Called when the extension needs to shut itself down, such as when the application is quitting or when the extension is about to be upgraded or disabled. Any user interface that has been injected must be removed, tasks shut down, and objects disposed of.

function shutdown(aData, aReason) {
	
	// Let's update whitelist database
	database.close();
	
	// When the application is shutting down we normally don't have to clean
	// up any UI changes made
	if (aReason == APP_SHUTDOWN){
		return;
	}
	
	// Remove page load observer
	policy.unregister();
	
	windowListener.unregister();
}

function install(aData, aReason) { }

// This function is called after the last call to shutdown() before a particular version of an extension is uninstalled. This will not be called if install() was never called.

function uninstall(aData, aReason) {
	
	if (aReason == ADDON_UNINSTALL) {
		//Really uninstalling the addon, Let's delete all prefs
		Services.prefs.deleteBranch('extensions.micro-adblock');
		Services.prefs.deleteBranch('services.sync.prefs.sync.extensions.micro-adblock.');
	}
}