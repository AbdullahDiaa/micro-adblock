let $ = function(window, id) window.document.getElementById(id);

let windowWatcher = function(subject, topic) {
	if (topic === "domwindowopened") {
		windowManager.runOnLoad(subject, windowManager.loadIntoWindow, windowManager);
	}
};

/**
*
* Add MutationObserver to remove add blocks/remove tracking links.
*/
function handlePageLoad(e) {
		
	try {
		var win = e.originalTarget.defaultView;
		var doc = win.document;
		var blocklist = database.blocklist;
	
		if(null === doc.location.host || "" === doc.location.host)
			return;
	
		if(database.isWhitelisted(doc.location.host)){
			console.log(doc.location.host + " is whitelisted.");
			return;
		}
	
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
	
		return;
	} catch (e) {
		console.log("ERR", e);
	}
};

/**
 *
 * Location change monitor to update µ Adblock icon from whitelist
 */
let progressListener = {
	QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIWebProgressListener]),
	onLocationChange: function(aProgress, aRequest, aURI)
	{
		let window = Services.wm.getMostRecentWindow("navigator:browser");
		try{
			if(aURI.schemeIs("http") || aURI.schemeIs("https")){
				let button = $( window, windowManager.BUTTON_ID);
				
				if(database.isWhitelisted(aURI.host)){
					button.img.src = (button.getAttribute('cui-areatype') == "menu-panel") ? windowManager.getIcon(32, false) : windowManager.getIcon(16, false);
				}else{
					button.img.src = (button.getAttribute('cui-areatype') == "menu-panel") ? windowManager.getIcon(32, true) : windowManager.getIcon(16, true);
				}
			}
			
		}catch(e){
			console.log("ERR", e.name);
		}

	}	
};

let windowManager = {
	NS_XUL : "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
	BUTTON_ID : "micro-adblock-toolbar-button",
	/**
	*
	* Toggle whitelist record
	*/
	toggleButton : function(){
		let toggle = !database.toggle();	
		this.img.src = (this.getAttribute('cui-areatype') == "menu-panel") ? windowManager.getIcon(32, toggle) :   windowManager.getIcon(16, toggle);
		console.log(prefs.getPref("reloadPage"));
	
		// Reload page on toggle
		if(prefs.getPref("reloadPage")){
			console.log("reload");
			let window = Services.wm.getMostRecentWindow("navigator:browser");
			window.content.document.location.reload(true);
		}
	},
	
	/**
	*
	* Context-menu click event
	*/
	onCommand : function(e) {
		var target = e.target;
		if (!target) return;
		database.record_div(target.block);
	},
	
	/**
	*
	* Generate Icon Resource URI
	*/
	getIcon : function (size, enabled){
		return addon.getResourceURI("icons/icon" + size + (!enabled ? "-disabled": "") +  ".png").spec;
	},
	
	eachWindow : function(callback) {
		var that = this;

		let windowEnumerator = Services.wm.getEnumerator("navigator:browser");

		while (windowEnumerator.hasMoreElements()) {
			let domWindow = windowEnumerator.getNext();			
			if (domWindow.document.readyState === 'complete') {
				callback(domWindow, that);
			} else {							
				that.runOnLoad(domWindow, callback, that);
			}
		}
	},
	
	runOnLoad : function(window, callback, that) {
		var that = this;	

		window.addEventListener("load", function() {
			window.removeEventListener("load", arguments.callee, false);
			callback(window, that);
		}, false);
	},
	
	decideToShowMyMenuItem : function(e) {
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
	},
	
	load : function(){
		var that = this;	
				
		// Load into any existing windows
		let windows = Services.wm.getEnumerator("navigator:browser");
		
		while (windows.hasMoreElements()) {			
			let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);			
			windowManager.loadIntoWindow(domWindow, that);
		}
	
		// Add the button/listeners in every open window
		this.eachWindow(windowManager.loadIntoWindow);
		Services.ww.registerNotification(windowWatcher);
	},
	
	unload : function(){
		var that = this;	
		
		// Remove button/lisenters from all windows
		Services.ww.unregisterNotification(windowWatcher);
		this.eachWindow(this.unloadFromWindow);
	},
	
	loadIntoWindow : function(window, that) {
		if (!window)
			return;
		
		
		window.addEventListener("DOMContentLoaded", handlePageLoad, false);
		
		var contentAreaContextMenu = window.document.getElementById('contentAreaContextMenu');
		if (contentAreaContextMenu) {
			var menuItem = window.document.createElement('menuitem');
			menuItem.setAttribute('label', 'Block');
			menuItem.setAttribute("class", "menuitem-iconic");
			menuItem.setAttribute('id', 'myMenuItem');
			menuItem.setAttribute('image', "chrome://microadblock/skin/icon16.png");
			menuItem.setAttribute('hidden', 'true');
			menuItem.addEventListener("command", this.onCommand, false);
		
			contentAreaContextMenu.appendChild(menuItem);

			contentAreaContextMenu.addEventListener('popupshowing',that.decideToShowMyMenuItem,false);
		}

		let toolbox = window.gNavToolbox || $(window, 'navigator-toolbox');
		
		if (toolbox) { // navigator window
			// add to palette
			let button = window.document.createElementNS(that.NS_XUL, "toolbarbutton");
			button.setAttribute("id", that.BUTTON_ID);
			button.setAttribute("label", "Micro Adlbock");
			button.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
			button.setAttribute("tooltiptext", "Micro Adlbock");
			
			let img = button.img = window.document.createElementNS("http://www.w3.org/1999/xhtml","img");
			img.src = (button.getAttribute('cui-areatype') == "menu-panel") ? that.getIcon(32, true) : that.getIcon(16, true);
			
			button.appendChild( img );
	  	  	
			// @TODO: Add badge with blocked links
			//let badge = button.badge = window.document.createElementNS("http://www.w3.org/1999/xhtml","div");
			//button.badge.style.display = "block";
			//button.badge.textContent = "2";
			//button.badge.setAttribute("style", "margin-top:-16px;padding: 1px 2px;margin-right:-16px;position:relative;z-index:99;background:#C13832 none;border-radius:3px;padding:2px;line-height:1;font-size:8px;color:white;white-space:nowrap;box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);");
			//button.appendChild( badge );
			button.addEventListener("command", that.toggleButton, false);			
			
			toolbox.palette.appendChild(button);
	  
			// move to saved toolbar position
			let {toolbarId, nextItemId} = prefs.getPrefs(),	  
			toolbar = toolbarId && $( window, toolbarId);
						
			if (toolbar) {
				let nextItem = $( window, nextItemId);				
				toolbar.insertItem(that.BUTTON_ID , nextItem && nextItem.parentNode.id == toolbarId && nextItem, null, false);
			}
	  	  	
			window.addEventListener("aftercustomization", that.afterCustomize, false);
			window.gBrowser.addProgressListener(progressListener);

		}
	},
	
	unloadFromWindow: function(window, that) {
		if (!window)
			return;
	
		var contentAreaContextMenu = $(window, 'contentAreaContextMenu');
		if (contentAreaContextMenu) {
			var myMenuItem = $(window, 'myMenuItem');
			myMenuItem.removeEventListener("command", that.onCommand, false);
			contentAreaContextMenu.removeChild(myMenuItem);
			contentAreaContextMenu.removeEventListener('popupshowing',that.decideToShowMyMenuItem,false);		
		}
	
		window.removeEventListener("DOMContentLoaded", that.handlePageLoad, false);

		for each(let node in contentAreaContextMenu) {
			if(node && node.id == 'myMenuItem'){
				contentAreaContextMenu.removeChild(node);
				break;
			}
		}
	
		//if(window.MutationObserver)
		//	window.MutationObserver.disconnect();
	
		window.gBrowser.removeProgressListener(progressListener);
	
		// Remove any persistent UI elements
		// Perform any other cleanup
		let doc = window.document;
		let button = $( window, that.BUTTON_ID);
	
		if(button)
			button.removeEventListener("command", that.toggleButton, false);
	
		window.removeEventListener("aftercustomization", that.afterCustomize, false);
		button.parentNode.removeChild(button);

		let toolbox = window.gNavToolbox || $(window, 'navigator-toolbox');
		if(toolbox && toolbox.palette.id == 'BrowserToolbarPalette') {
			for each(let node in toolbox.palette) {
				if(node && node.id == that.BUTTON_ID) {
					toolbox.palette.removeChild(node);
					break;
				}
			}
		}	
	},
	
	afterCustomize : function(e) {
		if (!window)
			return;
	
		let toolbox = e.target;
		let button = $( window, this.BUTTON_ID);
	
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
};
