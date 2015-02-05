let $ = function(window, id) window.document.getElementById(id);

/**
*
* Toggle whitelist record
*/
function toggleButton(e){
	
	let window = Services.wm.getMostRecentWindow((Services.appinfo.name === "Thunderbird" ? "mail:3pane" : "navigator:browser"));
	let activeWindow = window.content.document.location.host;
	
	if(database.toggle(activeWindow)){
		this.img.src = windowListener.getIconURI("", false);
	}else{
		this.img.src = windowListener.getIconURI("", true);
	}
	
	// Reload page on toggle
	if(prefs.getPref("reloadPage")){
		window.content.document.location.reload(true);
	}
}

/**
*
* Add MutationObserver to remove add blocks/remove tracking links.
*/
function handlePageLoad(e) {
	console.log("handlePageLoad");
	var win = e.originalTarget.defaultView;
	var doc = win.document;
		
	var blocklist = database.blocklist;
		
	if(null === doc.location.host || "" === doc.location.host)
		return;
	
	if(database.isWhitelisted(doc.location.host))
		return;
	
	var domain = (doc.location.host.match(/([^.]+)\.\w{2,3}(?:\.\w{2})?$/) || [])[1]
	
	if(blocklist[domain]){
		
		// Monitor target element and observe it to remove 
		if(blocklist[domain].t){
			// select the target node
			var target = doc.querySelector(blocklist[domain].t);
		 	   	
			if(target){
				if(blocklist[domain].r){
					var elements = doc.querySelectorAll(blocklist[domain].r);
					var i = elements.length;

					while(i--) {
						console.log("Removed", blocklist[domain].r);
						elements[i].parentNode.removeChild(elements[i]);
					}
				}
				
				// Remove attribute from links
				if(blocklist[domain].l){
					var links = doc.querySelectorAll(blocklist[domain].l.t);

					if(links.length > 0){
						for ( var i = 0; i < links.length; i++ ) {
							console.log("Cleaning links");
							links[i].removeAttribute( blocklist[domain].l.r );
						}
					}
				}
				
				if(blocklist[domain].o){
					var MutationObserver = win.MutationObserver;
					// create an observer instance
					var observer = new MutationObserver(function(mutations) {
						if(blocklist[domain].r){
							var elements = doc.querySelectorAll(blocklist[domain].r);
							var i = elements.length;

							while(i--) {
								console.log("Removed", blocklist[domain].r);
								elements[i].parentNode.removeChild(elements[i]);
							}
						}
						
						// Remove attribute from links
						if(blocklist[domain].l){
							var links = doc.querySelectorAll(blocklist[domain].l.t);

							if(links.length > 0){
								for ( var i = 0; i < links.length; i++ ) {
									console.log("Cleaning links");
									links[i].removeAttribute( blocklist[domain].l.r );
								}
							}
						}
						
					});
			
					// configuration of the observer:
					var config = { childList:true };

					// pass in the target node, as well as the observer options
					observer.observe(target, config);
				}
			}
		}
					
	}
};

/**
 *
 * Location change monitor to update µ Adblock icon from whitelist
 */
var progressListener = {
	QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIWebProgressListener]),
	onLocationChange: function(aProgress, aRequest, aURI)
	{	
		console.log("onLocationChange");
		let window = Services.wm.getMostRecentWindow((Services.appinfo.name === "Thunderbird" ? "mail:3pane" : "navigator:browser"));
		if(aURI.schemeIs("http") || aURI.schemeIs("https")){
			let button = $( window, BUTTON_ID);
			console.log(aURI.host);
			if(database.isWhitelisted(aURI.host)){
				button.img.src =  windowListener.getIconURI(button.getAttribute('cui-areatype'), false);
			}else{
				button.img.src =  windowListener.getIconURI(button.getAttribute('cui-areatype'));
			}
		}
	}	
};

/**
*
* Context-menu click event
*/
function onCommand(e) {
	var target = e.target;
	if (!target) return;
	database.record_div(target.block);
};

function decideToShowMyMenuItem(e) {
	var window = e.target.ownerDocument.defaultView;
	var document = window.document;
	var myMenuItem = document.getElementById('myMenuItem');

	if (myMenuItem) {
		var popupNode = document.popupNode;
		if (popupNode.parentNode.nodeName == 'A') {
			//sometimes people put elements between the a tags like: <a href="blah"><b>bolded link</b></a>
			//so we check to see if parentNode is link
			popupNode = popupNode.parentNode;			
		}
		//cDump(popupNode);
		var href = popupNode.href; //dont do popupNode.getAttribute() because if href is relative path, it wont have base name in it

		if (href) {
			myMenuItem.label = "Block [" +  popupNode.hostname + "]";
			myMenuItem.hidden = false;
			myMenuItem.block = popupNode.hostname;
		}
	}
};

/*start - windowlistener*/
var windowListener = {
	//DO NOT EDIT HERE
	onOpenWindow: function (aXULWindow) {
		// Wait for the window to finish loading
		var aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
				
		aDOMWindow.addEventListener('load', function () {
			aDOMWindow.removeEventListener('load', arguments.callee, false);
			
			windowListener.loadIntoWindow(aDOMWindow);
		}, false);
	},
	onCloseWindow: function (aXULWindow) {},
	onWindowTitleChange: function (aXULWindow, aNewTitle) {},
	register: function () {
		// Load into any existing windows
		var DOMWindows = Services.wm.getEnumerator(null);
		
		while (DOMWindows.hasMoreElements()) {
			var aDOMWindow = DOMWindows.getNext();
			
			if (aDOMWindow.document.readyState == 'complete') { //on startup `aDOMWindow.document.readyState` is `uninitialized`				
				windowListener.loadIntoWindow(aDOMWindow);
			} else {
				aDOMWindow.addEventListener('load', function () {
					aDOMWindow.removeEventListener('load', arguments.callee, false);
					windowListener.loadIntoWindow(aDOMWindow);
				}, false);
			}
		}
		// Listen to new windows
		Services.wm.addListener(windowListener);
	},
	unregister: function () {
		//Stop listening so future added windows dont get this attached
		Services.wm.removeListener(windowListener);
		
		// Unload from any existing windows
		var DOMWindows = Services.wm.getEnumerator(null);
		while (DOMWindows.hasMoreElements()) {
			var aDOMWindow = DOMWindows.getNext();
			windowListener.unloadFromWindow(aDOMWindow);
		}		
	},
	
	/**
	*
	* Generate Icon Resource URI
	*/
	getIconURI : function (placement, enabled){
		
		//Set default status of icon to "Enabled"
		enabled = typeof enabled !== 'undefined' ? enabled : true;
		var size = 16;

		let inMenuPanel = false;
				
		if(placement === "menu-panel")
			inMenuPanel = true;
		
		console.log(Services.appinfo.name);
		//Always use big icon for SeaMonkey and areas other than AREA_NAVBAR
		if(Services.appinfo.name === "SeaMonkey" || inMenuPanel)
			size = 32;
		
		return addon.getResourceURI("icons/icon" + size + (!enabled ? "-disabled": "") +  ".png").spec;
	},
	
	//END - DO NOT EDIT HERE
	loadIntoWindow: function (window) {
		if (!window) {
			return;
		}

		let doc = window.document;
		let toolbox = window.gNavToolbox || $(window, 'navigator-toolbox') || $(window, "mail-toolbox");
		
		if (toolbox) { // navigator window
			
			// Create the toolbar button
			let button = doc.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'toolbarbutton');
			
			// Create toolbar Image
			let img = button.img = doc.createElementNS("http://www.w3.org/1999/xhtml","img");
			img.src =  this.getIconURI(button.getAttribute('cui-areatype'));
			
			// Set button attributes
			var props = {
				id: BUTTON_ID, //id in dom // SHOULD match id of that in cui.jsm (Line #2)
				title: "Micro AdBlock",
				tooltiptext: "u Adblock",
				align: 'center',
				pack: 'center',
				class: 'toolbarbutton-1 chromeclass-toolbar-additional',
				removable: 'true',
				sdkstylewidget: 'true',
				overflows: false
			};
			
			for (var p in props) {
				button.setAttribute(p, props[p]);
			}
			button.appendChild(img);
			button.addEventListener("command", toggleButton, false);			
			
			toolbox.palette.appendChild(button);
			
			// Move the button to saved toolbar position
			let {toolbarId, nextItemId} = prefs.getPrefs(),
			toolbar = toolbarId && ($( window, toolbarId) || $(window, 'mail-bar3'));
			
			if (toolbar) {
				let nextItem = $( window, nextItemId);	
				console.log(button.img);			
				toolbar.insertItem(BUTTON_ID , nextItem && nextItem.parentNode.id == toolbarId && nextItem, null, false);
			}
	  	  	
			//Add Block[location] context-menu
			var contentAreaContextMenu = doc.getElementById('contentAreaContextMenu');
			if (contentAreaContextMenu) {
				var menuItem = doc.createElement('menuitem');
				menuItem.setAttribute('label', 'Block');
				menuItem.setAttribute("class", "menuitem-iconic");
				menuItem.setAttribute('id', 'myMenuItem');
				menuItem.setAttribute('image', "chrome://microadblock/skin/icon16.png");
				menuItem.setAttribute('hidden', 'true');
				menuItem.addEventListener("command", onCommand, false);
		
				contentAreaContextMenu.appendChild(menuItem);

				contentAreaContextMenu.addEventListener('popupshowing', decideToShowMyMenuItem,false);
			}
			
			// SeaMonkey can't catch gBrowser :< 
			var browser = (window.gBrowser || window.getBrowser());
			if(browser){
				// monitor DOMContentLoaded to remove ad divs
				browser.addEventListener("DOMContentLoaded", handlePageLoad, true);

				// Add location URL monitoring		
				browser.addProgressListener(progressListener);
			}
			
		}
	},
	unloadFromWindow: function (window) {
		if (!window) {
			return;
		}
		let doc = window.document;
		
		
		//Remove toolbarbutton
		let button = $( window, BUTTON_ID);
		if(button){
			button.removeEventListener("command", toggleButton, false);
			button.parentNode.removeChild(button);
		}
		
		//Remove context-menu item
		var contentAreaContextMenu = $(window, 'contentAreaContextMenu');
		if (contentAreaContextMenu) {
			var myMenuItem = $(window, 'myMenuItem');
			myMenuItem.removeEventListener("command", onCommand, false);
			contentAreaContextMenu.removeChild(myMenuItem);
			contentAreaContextMenu.removeEventListener('popupshowing',decideToShowMyMenuItem,false);		
		}	
		
		
		// SeaMonkey can't catch gBrowser :< 
		if(!window.gBrowser)
			window.gBrowser = window.getBrowser();

		if(window.gBrowser){
			// remove DOMContentLoaded listener
			window.gBrowser.removeEventListener("DOMContentLoaded", handlePageLoad, true);
			
			//remove location listener
			window.gBrowser.removeProgressListener(progressListener);
		}
	}
};
/*end - windowlistener*/