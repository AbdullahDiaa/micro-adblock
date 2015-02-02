let $ = function(window, id) window.document.getElementById(id);

/**
 *
 * Toggle whitelist record
 */
function toggleButton(){
	// Reload page on toggle
	if(getPref("reloadPage")){
		let window = Services.wm.getMostRecentWindow("navigator:browser");
		window.content.document.location.reload(true);
	}
	let toggle = !database.toggle();
	this.img.src = (this.getAttribute('cui-areatype') == "menu-panel") ? getIcon(32, toggle) :   getIcon(16, toggle);
}

/**
 *
 * Location change monitor to update µ Adblock icon from whitelist
 */
const progressListener = {
	QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIWebProgressListener]),
	onLocationChange: function(aProgress, aRequest, aURI)
	{
		let window = Services.wm.getMostRecentWindow("navigator:browser");
		try{
			if(aURI.schemeIs("http") || aURI.schemeIs("https")){
				let button = $( window, BUTTON_ID);
				
				if(database.isWhitelisted(aURI.host)){
					button.img.src = (button.getAttribute('cui-areatype') == "menu-panel") ? getIcon(32, false) :   getIcon(16, false);
				}else{
					button.img.src = (button.getAttribute('cui-areatype') == "menu-panel") ? getIcon(32, true) :   getIcon(16, true);
				}
			}
			
		}catch(e){
			console.log("ERR", e.name);
		}

	}	
};

function getIcon(size, enabled){
	return addon.getResourceURI("icons/icon" + size + (!enabled ? "-disabled": "") +  ".png").spec;
}

/**
 *
 * Add MutationObserver to remove add blocks/remove tracking links.
 */
function handlePageLoad(e) {
	try {
		let doc = e.originalTarget;
		let win = doc.defaultView;
		
		if(null != doc.location.host && "" != doc.location.host){

			var observeDOM = (function(){
				var MutationObserver = win.MutationObserver;

				return function(obj, callback){
					// define a new observer
					var obs = new MutationObserver(function(mutations){
						if( mutations[0].addedNodes.length || mutations[0].removedNodes.length )
							callback();
					});
					// have the observer observe foo for changes in children
					obs.observe( obj, { childList:true, subtree:true });
				}
			})();
			var domain = (doc.location.host.match(/([^.]+)\.\w{2,3}(?:\.\w{2})?$/) || [])[1]

			if(database.isWhitelisted(doc.location.host))
				return;
			
			// Delete Ad blocks from twitter/facebook/daum/naver/google/youtube
			switch(domain){
			case 'twitter':
				var target = doc.querySelector('#timeline');
					
				if(!target)
					return;
					
				observeDOM( target ,function(){ 
					var elements = doc.querySelectorAll(".promoted-tweet, .promoted-account,.promoted-trend");
					var i = elements.length;

					while(i--) {
						console.log("Dleteling Promoted Tweet.");
						elements[i].parentNode.removeChild(elements[i]);
					}
				});
					
				return;
				
			case 'youtube':
				var target = doc.querySelector('#page-container');
					
				if(!target)
					return;
					
				observeDOM( target ,function(){ 
					var elements = doc.querySelectorAll("#ad_creative_1, .ad-container, #google_companion_ad_div");
					var i = elements.length;

					while(i--) {
						console.log("Dleteling Youtube Ads.");
						elements[i].parentNode.removeChild(elements[i]);
					}
				});
				return;
				
			case 'yahoo':
					
				var elements = doc.querySelectorAll(".spnd, .ads");
				var i = elements.length;
					
				while(i--) {
					console.log("Dleteling YAHOO! Ads.");
					elements[i].parentNode.removeChild(elements[i]);
				}

				var links = doc.querySelectorAll('a[dirtyhref].yschttl');

				if(links.length > 0){
					for ( var i = 0; i < links.length; i++ ) {
						console.log("Stripping YAHOO! links");
						links[i].removeAttribute( 'dirtyhref' );
					}
				}					
				return;
				
			case 'google':
				
				var target = doc.querySelector('body');
					
				if(!target)
					return;
									
				observeDOM( target ,function(){ 
					var links = doc.querySelectorAll("#ires h3 a[onmousedown], #ires .fc a[onmousedown]");
					if(links.length > 0){
						for ( var i = 0; i < links.length; i++ ) {
							console.log("Stripping Google! links.");
							links[i].removeAttribute( 'onmousedown' );
						}
					}
					
					var ads = doc.querySelectorAll("li.ads-ad, h2._hM, div._M2b, div#bottomads");
					if(ads.length > 0){
						for ( var y = 0; y < ads.length; y++ ) {
							console.log("Stripping Google! Ads.");
							ads[y].parentNode.removeChild(ads[y]);
						}
					}
				});
				return;
			
			case 'facebook':
			
				var target = doc.querySelector('body');
				
				if(!target)
					return;
								
				observeDOM( target ,function(){ 
					var elements = doc.querySelectorAll("#home_sponsor_nile, #pagelet_ego_pane, .ego_column");
					var i = elements.length;

					while(i--) {
						console.log("Dleteling Facebook Ads.");
						elements[i].parentNode.removeChild(elements[i]);
					}
				});
				return;
			
			case 'daum':
		
				var target = doc.querySelector('body');
			
				if(!target)
					return;
							
				observeDOM( target ,function(){ 
					var links = doc.querySelectorAll(".wrap_tit a");
					if(links.length > 0){
						for ( var i = 0; i < links.length; i++ ) {
							console.log("Stripping DAUM! links.");
							links[i].removeAttribute( 'onclick' );
						}
					}
						
					var elements = doc.querySelectorAll(".ad_sch");
					var i = elements.length;

					while(i--) {
						console.log("Dleteling DAUM Ads.");
						elements[i].parentNode.removeChild(elements[i]);
					}
				});
				return;
			
			case 'naver':
	
				var target = doc.querySelector('.inner_article');
		
				if(!target)
					return;
						
				observeDOM( target ,function(){ 
					var links = doc.querySelectorAll("ul.type01 a");
					if(links.length > 0){
						for ( var i = 0; i < links.length; i++ ) {
							console.log("Stripping Naver! links.");
							links[i].removeAttribute( 'onclick' );
						}
					}
					
					var elements = doc.querySelectorAll(".ad_section");
					var i = elements.length;

					while(i--) {
						console.log("Dleteling Naver Ads.");
						elements[i].parentNode.removeChild(elements[i]);
					}
				});
				return;
			
			case 'facebook':
		
				var target = doc.querySelector('body');
			
				if(!target)
					return;
							
				observeDOM( target ,function(){ 
					var elements = doc.querySelectorAll("#home_sponsor_nile, #pagelet_ego_pane, .ego_column");
					var i = elements.length;
					
					while(i--) {
						console.log("Dleteling Facebook Ads.");
						elements[i].parentNode.removeChild(elements[i]);
					}
				});
				return;
			
			default:
				return;
			}
		}
	} catch (e) {
		console.log("ERR", e.name);
	}
}


function eachWindow(callback) {
	let windowEnumerator = Services.wm.getEnumerator("navigator:browser");
	
	while (windowEnumerator.hasMoreElements()) {
		let domWindow = windowEnumerator.getNext();
		if (domWindow.document.readyState === 'complete') {
			callback(domWindow);
		} else {
			runOnLoad(domWindow, callback);
		}
	}
}

function runOnLoad (window, callback) {
	window.addEventListener("load", function() {
		window.removeEventListener("load", arguments.callee, false);
		callback(window);
	}, false);
}

function windowWatcher (subject, topic) {
	if (topic === "domwindowopened") {
		runOnLoad(subject, loadIntoWindow);
	}
}

function loadIntoWindow(window) {
	if (!window)
		return;
	
	window.addEventListener("DOMContentLoaded", handlePageLoad, true);
	let toolbox = window.gNavToolbox || $(window, 'navigator-toolbox');
	
	if (toolbox) { // navigator window
		// add to palette
		let button = window.document.createElementNS(NS_XUL, "toolbarbutton");
		button.setAttribute("id", BUTTON_ID);
		button.setAttribute("label", "Mirco Adlbock");
		button.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
		button.setAttribute("tooltiptext", "Mirco Adlbock");

		let img = button.img = window.document.createElementNS("http://www.w3.org/1999/xhtml","img");
		img.src = (button.getAttribute('cui-areatype') == "menu-panel") ? getIcon(32, true) :   getIcon(16, true);
	  
		button.appendChild( img );
	  	  
		// @TODO: Add badge with blocked links
		//let badge = button.badge = window.document.createElementNS("http://www.w3.org/1999/xhtml","div");
		//button.badge.style.display = "block";
		//button.badge.textContent = "2";
		//button.badge.setAttribute("style", "margin-top:-16px;padding: 1px 2px;margin-right:-16px;position:relative;z-index:99;background:#C13832 none;border-radius:3px;padding:2px;line-height:1;font-size:8px;color:white;white-space:nowrap;box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);");
		//button.appendChild( badge );
  
		button.addEventListener("command",toggleButton , false);
	  	 
		toolbox.palette.appendChild(button);
	  
		// move to saved toolbar position
		let {toolbarId, nextItemId} = getPrefs(),	  
		toolbar = toolbarId && $( window, toolbarId);
	  
		if (toolbar) {
			let nextItem = $( window, nextItemId);
			toolbar.insertItem(BUTTON_ID , nextItem && nextItem.parentNode.id == toolbarId && nextItem, null, false);
		}
	  
		window.addEventListener("aftercustomization", afterCustomize, false);
		window.gBrowser.addProgressListener(progressListener);

	}
}

function unloadFromWindow(window) {
	if (!window)
		return;
	
	window.removeEventListener("DOMContentLoaded", handlePageLoad, true);
	window.gBrowser.removeProgressListener(progressListener);
	
	// Remove any persistent UI elements
	// Perform any other cleanup
	let doc = window.document;
	let button = $( window, BUTTON_ID);
	
	if(button)
		button.removeEventListener("command",toggleButton , false);
	
	window.removeEventListener("aftercustomization", afterCustomize, false);
	button.parentNode.removeChild(button);

	let toolbox = window.gNavToolbox || $(window, 'navigator-toolbox');
	if(toolbox && toolbox.palette.id == 'BrowserToolbarPalette') {
		for each(let node in toolbox.palette) {
			if(node && node.id == BUTTON_ID) {
				toolbox.palette.removeChild(node);
				break;
			}
		}
	}	
}

function setPrefs(toolbarId, nextItemId) {
	PREFS_BRANCH.setCharPref(PREF_TB, toolbarId || "");
	PREFS_BRANCH.setCharPref(PREF_NEXT, nextItemId || "");
}

function getPrefs() {	
	try {
		//Australis nav bar
		var ins = "nav-bar-customization-target";
	} catch (e) {
		console.log("ERR", e.name)
	}
	
	//Old navbar
	if(!ins)
		ins = "nav-bar";
	
	return {
		toolbarId: getPref(PREF_TB) ? getPref(PREF_TB) : ins,
		nextItemId: getPref(PREF_NEXT) ? getPref(PREF_NEXT) :"bookmarks-menu-button-container"
	};
};

function afterCustomize(e) {
	if (!window)
		return;
	
	let toolbox = e.target;
	let button = $( window, BUTTON_ID);
	
	let toolbarId, nextItemId;
	if (button) {
		let parent = button.parentNode,
		nextItem = button.nextSibling;
		console.log(parent);
				
		if (parent && (parent.localName == "toolbar" || parent.localName == "hbox")) {
			toolbarId = parent.id;
			nextItemId = nextItem && nextItem.id;
		}
	}
	
	setPrefs(toolbarId, nextItemId);
}