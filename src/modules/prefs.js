/* ***** BEGIN LICENSE BLOCK *****
* Version: MPL 1.1/GPL 2.0/LGPL 2.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is Speak Words.
*
* The Initial Developer of the Original Code is The Mozilla Foundation.
* Portions created by the Initial Developer are Copyright (C) 2010
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
*   Edward Lee <edilee@mozilla.com>
*
* Alternatively, the contents of this file may be used under the terms of
* either the GNU General Public License Version 2 or later (the "GPL"), or
* the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
* in which case the provisions of the GPL or the LGPL are applicable instead
* of those above. If you wish to allow use of your version of this file only
* under the terms of either the GPL or the LGPL, and not to allow others to
* use your version of this file under the terms of the MPL, indicate your
* decision by deleting the provisions above and replace them with the notice
* and other provisions required by the GPL or the LGPL. If you do not delete
* the provisions above, a recipient may use your version of this file under
* the terms of any one of the MPL, the GPL or the LGPL.
*
* ***** END LICENSE BLOCK ***** */


const PREF_BRANCH = "extensions.micro-adblock.";

//Default addons prefs
const PREFS = {
	'toolbar' : "nav-bar-customization-target",
	'next-item' :"bookmarks-menu-button-container",
	'social' : false,
	'reloadPage' : false,
	'whitelist_sync' : '{}',
	'divslist_sync' : '[]',
	'blocklist_sync' : '{"twitter":{"t":"#stream-items-id","r":".promoted-tweet, .promoted-account,.promoted-trend","o":true},"youtube":{"t":"#page-container","r":"#ad_creative_1, .ad-container, #google_companion_ad_div","o":true},"yahoo":{"t":"#page-container","r":".spnd, .ads","o":false,"l":{"t":"a[dirtyhref].yschttl","r":"dirtyhref"}},"google":{"t":"body","r":"li.ads-ad, h2._hM, div._M2b, div#bottomads","o":true,"l":{"t":"#ires h3 a[onmousedown], #ires .fc a[onmousedown]","r":"onmousedown"}},"yandex":{"t":"body","o":true,"l":{"t":".serp-item__title-link[onmousedown]","r":"onmousedown"}},"facebook":{"t":"body","r":"#home_sponsor_nile, #pagelet_ego_pane, .ego_column","o":true},"daum":{"t":"body","o":true,"r":".ad_sch","l":{"t":".wrap_tit a[onclick]","r":"onclick"}},"naver":{"t":"body","o":true,"r":".ad_section","l":{"t":"ul.type01 a[onclick]","r":"onclick"}},"baidu":{"t":"body","o":true,"r":".taw1","l":{"t":"ul.type01 a[onclick]","r":"onclick"}}}'
};

/**
 *
 * Get the preference value of type specified in PREFS
 */
function getPref(key) {
	// Cache the prefbranch after first use
	if (getPref.branch == null)
		getPref.branch = Services.prefs.getBranch(PREF_BRANCH);
	try{
		// Figure out what type of pref to fetch
		switch (typeof PREFS[key]) {
		case "boolean":
			if (getPref.branch.prefHasUserValue(key))
				return getPref.branch.getBoolPref(key);
			else
				return false;
		case "number":
			if (getPref.branch.prefHasUserValue(key))
				return getPref.branch.getIntPref(key);
			else
				return 0;
		case "string":
			if (getPref.branch.prefHasUserValue(key))
				return getPref.branch.getCharPref(key);
			else
				return "";
		}
	} catch (e) {
		console.log(e.name);
		return false;
	}
	return false;
}

/**
 *
 * Initialize default preferences and Sync it
 */
function setDefaultPrefs() {
	let branch = Services.prefs.getDefaultBranch(PREF_BRANCH);
	let sync_branch = Services.prefs.getDefaultBranch(SYNC_BRANCH);
	
	for (let [key, val] in Iterator(PREFS)) {
		switch (typeof val) {
		case "boolean":
			branch.setBoolPref(key, val);
			sync_branch.setBoolPref(key, val);
			break;
		case "number":
			branch.setIntPref(key, val);
			sync_branch.setIntPref(key, val);
			break;
		case "string":
			if(key.indexOf("_sync") === -1)			
				branch.setCharPref(key, val);
			sync_branch.setCharPref(key, val);		
			break;
		}
	}
	
}

/**
 *
 * Store whitelist data in sync branch
 * @param: String whitelist
 */
function syncList(key, list) {
	let sync_branch = Services.prefs.getDefaultBranch(SYNC_BRANCH);
	sync_branch.setCharPref(key + "_sync", list);
}

/**
 *
 * Retrieve whitelist data in sync branch
 */
function getSyncedList(key) {
	key = key + "_sync";
	var prefManager = Services.prefs.getBranch(SYNC_BRANCH);
	var prefString;
	if (prefManager.getCharPref(key)) {
		prefString = prefManager.getCharPref(key);
	} else {
		
		// Preference is default value so use that
		prefString = "{}";
	}

	return JSON.parse(prefString);
}

// Always set the default prefs.
setDefaultPrefs();