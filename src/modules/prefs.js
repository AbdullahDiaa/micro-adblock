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
*	Abdullah Diaa
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

let prefs = {
	// Defaut Prefs
	// Always merge prefs with this
	PREF_BRANCH : Services.prefs.getBranch("extensions.micro-adblock."),
	PREF_BRANCH_DEFAULT : Services.prefs.getDefaultBranch("extensions.micro-adblock."),
	
	PREF_TB : "toolbar",
	PREF_NEXT : "next-item",
	PREFS : {
		"toolbar" : "nav-bar",
		"next-item" :"bookmarks-menu-button-container",
		'social' : false,
		'reloadPage' : false,
		'whitelist_sync' : '{}',
		'divslist_sync' : '{}',
		'blocklist_sync' : '{"twitter":{"t":"#stream-items-id","r":".promoted-tweet, .promoted-account,.promoted-trend","o":true},"youtube":{"t":"#page-container","r":"#ad_creative_1, .ad-container, #google_companion_ad_div","o":true},"yahoo":{"t":"#page-container","r":".spnd, .ads","o":false,"l":{"t":"a[dirtyhref].yschttl","r":"dirtyhref"}},"google":{"t":"body","r":"li.ads-ad, h2._hM, div._M2b, div#bottomads","o":true,"l":{"t":"#ires h3 a[onmousedown], #ires .fc a[onmousedown]","r":"onmousedown"}},"yandex":{"t":"body","o":true,"l":{"t":".serp-item__title-link[onmousedown]","r":"onmousedown"}},"facebook":{"t":"body","r":"#home_sponsor_nile, #pagelet_ego_pane, .ego_column","o":true},"daum":{"t":"body","o":true,"r":".ad_sch","l":{"t":".wrap_tit a[onclick]","r":"onclick"}},"naver":{"t":"body","o":true,"r":".ad_section","l":{"t":"ul.type01 a[onclick]","r":"onclick"}},"baidu":{"t":"body","o":true,"r":".taw1","l":{"t":"ul.type01 a[onclick]","r":"onclick"}}}'
	},
	//Sync Prefs branch
	SYNC_BRANCH : Services.prefs.getBranch("services.sync.prefs.sync.extensions.micro-adblock."),
	SYNC_BRANCH_DEFAULT : Services.prefs.getDefaultBranch("services.sync.prefs.sync.extensions.micro-adblock."),
	
	/**
	 *
	 * Get the preference value of type specified in PREFS
	 */
	getPref : function(key){	
		// Figure out what type of pref to fetch
		switch (typeof this.PREFS[key]) {
		case "boolean":
			return this.PREF_BRANCH.getBoolPref(key);
		case "string":
			return this.PREF_BRANCH.getCharPref(key);
		}
	},
	
	/**
	 *
	 * Initialize default preferences and Sync it
	 */
	setDefaultPrefs : function(){
	
		for (let [key, val] in Iterator(this.PREFS)) {
			switch (typeof val) {
			case "boolean":
				this.PREF_BRANCH_DEFAULT.setBoolPref(key, val);
				this.SYNC_BRANCH_DEFAULT.setBoolPref(key, val);
				break;
			case "string":
				if(key.indexOf("_sync") === -1)			
					this.PREF_BRANCH_DEFAULT.setCharPref(key, val);
				
				this.SYNC_BRANCH_DEFAULT.setCharPref(key, val);		
				break;
			}
		}
		
	},

	setPrefs : function(toolbarId, nextItemId) {
		this.PREF_BRANCH_DEFAULT.setCharPref(this.PREF_TB, toolbarId || "");
		this.PREF_BRANCH_DEFAULT.setCharPref(this.PREF_NEXT, nextItemId || "");
	},

	getPrefs : function() {	
		
		return {
			toolbarId: this.getPref(this.PREF_TB),
			nextItemId: this.getPref(this.PREF_NEXT) ? this.getPref(this.PREF_NEXT) :"bookmarks-menu-button-container"
		};
	},
	
	/**
	 *
	 * Store whitelist data in sync branch
	 * @param: String key
	 * @param: String list
	 */
	syncList : function(key, list) {
		this.SYNC_BRANCH.setCharPref(key + "_sync", list);
	},
	
	/**
	 *
	 * Retrieve whitelist data in sync branch
	 */
	getSyncedList : function(key) {
		prefString = this.SYNC_BRANCH.getCharPref(key + "_sync");
		return JSON.parse(prefString);
	}
};

// Always set the default prefs.
prefs.setDefaultPrefs();