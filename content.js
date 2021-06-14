/*
*
* Copyright 2020, Ethan Lebowitz, All Rights Reserved
*
*
*
*/


const targetNode = document.getElementById('cht_bx');
const config = { attributes: true, childList: true, subtree: true };


/* function retrieve(key){
	
	var value = {};
	chrome.storage.local.get([key], function(result) {
		console.log('Value currently is ' + result.key);
	});
	if(value == null){value = {};}
	return value;
	
} */


class Player {
	
	constructor(username, x, y, seat){
		
		this.username = username;
		this.x = x;
		this.y = y;
		this.seat = seat;
		
	}
	
}

class Settings {
	
	constructor(){
		
		var self = this;
		this.statsToShow = [];
		this.recordBox = true;
		this.showingHUD = true;
		chrome.storage.local.get(['settings'], function(result) {
			console.log('Value currently is ' + result.settings);
			//self.setStatsToShow(result.settings.stats);
			self.statsToShow = result.settings.panelSettings;
			//console.log(result.settings.stats);
			self.recordBox = result.settings.recordBox;
		});
		
	}
	
	checkIfRecordingHands(){
		
		var self = this;
		chrome.storage.local.get(['settings'], function(result) {
			self.recordBox = result.settings.recordBox;
		});
		return this.recordBox;
		
	}
	
	checkIfShowingHUD(){
		
		var self = this;
		chrome.storage.local.get(['settings'], function(result) {
			self.showingHUD = result.settings.showingHUD;
		});
		return this.showingHUD;
		
	}
	
}

class Panel { //gets made by HUD
	
	constructor(player, aggregator, playerNumber, settings){
		
		this.settings = settings;
		var canvas = this.getCanvas(); //scale coordinates to canvas size
		var scaleFactor = this.getScaleFactor(canvas); //returns [xScale, yScale]
		this.aggregator = aggregator;
		this.playerNumber = playerNumber;
		this.div = document.createElement("div");
		this.div = this.addCoordinates(player, this.div, canvas, scaleFactor);
		this.div = this.addPadding(this.div, scaleFactor);
		this.div = this.addText(player, this.div, scaleFactor, canvas);
		var ID = player.username+"Stats";
		this.div.id = ID;
		this.div.style.background = "rgba(35, 84, 92, 0.6)";
		
	}
	
	addFontSize(div, scaleFactor, canvas){
		
		var baseFontSize = 15;
		var potatoWidth = 1440; 
		var canvasRes = parseInt(canvas.width, 10);
		var resScale = canvasRes / potatoWidth; //if resolution is potato resScale == 1. else resScale > 1.
		var scaledToResolution = baseFontSize * resScale; //only gonna use width for this
		var scaledFontSize = scaledToResolution * scaleFactor[0]; //just using one of the scale dimensions. both scale dimensions should be the same anyway
		div.style.fontSize = String(scaledFontSize) + "px";
		return div;
		
	}
	
	addStatText(player, div){
		
		var stats = this.aggregator.stats;
		var lines = this.settings.statsToShow;
		//if(statsToDisplay == null){statsToDisplay = ["VPIP", "PFR", "AF"]}
		var tableSize = this.aggregator.handed(this.playerNumber);
		var username = player.username;
		var string = "";
		for(var k=0; k<lines.length-1; k++){ //for each line
			if(!(lines[k].length == 0) && !(k==0)){
				string = string + "\n";
			}
			for(var i=0; i<lines[k].length; i++){ //for each stat in line
				var statName = lines[k][i].slice(1, lines[k][i].length); //chop off the label setting on the front
				var labelStatus = lines[k][i].slice(0, 1);
				var dataDict = stats[statName];
				var statText = this.aggregator.getStat(statName, dataDict, tableSize, username);
				if(labelStatus == "l"){
					string = string + statName + ": " + statText + "/";
				}else if(labelStatus == "n"){
					string = string + " " + statText + " /";
				}
			}
		}
		div.innerText = string;
		div.style.color = "white";
		return div;
	}
	
	addText(player, div, scaleFactor, canvas){
		
		div = this.addFontSize(div, scaleFactor, canvas);
		div = this.addStatText(player, div);
		return div;
		
	}
	
	addPadding(div, scaleFactor){
		
		var top = 2;
		var right = 5;
		var bottom = 2;
		var left = 5;
		var scaledTop = top * scaleFactor[1];
		var scaledRight = right * scaleFactor[0];
		var scaledBottom = bottom * scaleFactor[1];
		var scaledLeft = left * scaleFactor[0];
		div.style.padding = "2px 5px 2px 5px"; //top right bottom left
		return div;
		
	}
	
	getCanvasDimensions(canvas){ //canvas resolution dimensions
		
		var canvasWidth = parseInt(canvas.width, 10);
		var canvasHeight = parseInt(canvas.height, 10);
		return [canvasWidth, canvasHeight];
		
	}
	
	getCanvasAbsoluteDimensions(canvas){ //actual dimensions of canvas on page
		
		var canvasAbsoluteWidth = canvas.offsetWidth;
		var canvasAbsoluteHeight = canvas.offsetHeight;
		return [canvasAbsoluteWidth, canvasAbsoluteHeight];
		
	}
	
	getScaleFactor(canvas){
		
		var canvasDimensions = this.getCanvasDimensions(canvas);
		var canvasAbsoluteDimensions = this.getCanvasAbsoluteDimensions(canvas);
		var verticalScale = canvasAbsoluteDimensions[1] / canvasDimensions[1]; //if canvas is physically smaller than its resolution scale factor should be < 1
		var horizontalScale = canvasAbsoluteDimensions[0] / canvasDimensions[0];
		return [horizontalScale, verticalScale];
	
	}
	
	scaleCoordinates(coords, scaleFactor){
		
		var x = coords[0] * scaleFactor[0];
		var y = coords[1] * scaleFactor[1];
		return [x,y];
		
	}
	
	slideCoordinates(coords, canvas){
		
		//var chat = document.getElementById('chat');
		// offset with chat width and navbar height as well as left margin on certain window dimensions
		var leftMargin = canvas.style.marginLeft;
		var canvasMarginInt = parseInt(leftMargin.slice(0,leftMargin.length-2), 10)
		var game = document.getElementById("game");
		var gameMargin = game.style.marginLeft; //gets margin in vw
		var pxPerVw = (document.documentElement.clientWidth / 100);
		var gameMarginPx = pxPerVw * parseInt(gameMargin.slice(0,gameMargin.length-2), 10);
		var horizontalOffset = canvasMarginInt + gameMarginPx; //chat.offsetWidth + 
		var navBar = document.getElementById('header');
		var verticalOffset = navBar.offsetHeight;
		var x = coords[0];
		var y = coords[1];
		x = x+horizontalOffset;
		y = y+verticalOffset;
		return [x,y];
		
	}
	
	shiftCoordsDown(coords, canvas, scaleFactor){ //shift by percentage to get below name
		
		var x = coords[0];
		var y = coords[1];
		var canvasDimensions = this.getCanvasDimensions(canvas);
		var yShiftPercent = 0.03; //not actually a percent just a decimal
		var xShiftPercent = -0.07;
		var xShift = canvasDimensions[0] * xShiftPercent;
		var yShift = canvasDimensions[1] * yShiftPercent;
		/* var absoluteXShift = xShift * scaleFactor[0];
		var absoluteYShift = yShift * scaleFactor[1]; */
		var shiftedX = x + xShift;
		var shiftedY = y + yShift;
		return [shiftedX, shiftedY];
		
	}
	
	translateImgCoords(coords, canvas, scaleFactor){ //translate from image coords to page coords. coords = [x,y]
		
		var downShiftedCoords = this.shiftCoordsDown(coords, canvas); //move them under the name
		var scaledCoords = this.scaleCoordinates(downShiftedCoords, scaleFactor); //scale with canvas
		var finalCoords = this.slideCoordinates(scaledCoords, canvas); //move over and down for chat and navbar padding
		return finalCoords;
		
	}
	
	addCoordinates(player, div, canvas, scaleFactor){
		
		var x = player.x;
		var y = player.y;
		var coords = this.translateImgCoords([x,y], canvas, scaleFactor);
		var translatedX = coords[0];
		var translatedY = coords[1];
		
		div.style.position = "absolute";
		div.style.top = String(translatedY)+"px";
		div.style.left = String(translatedX)+"px";
		
		return div;
		
	}
	
	findFirstDescendant(parent, tagname){ //https://stackoverflow.com/questions/236624/how-to-access-html-element-without-id
		parent = document.getElementById(parent);
		var descendants = parent.getElementsByTagName(tagname);
		if ( descendants.length ){
			return descendants[0];
		}
		return null;
	}
	
	getCanvas(){
		return this.findFirstDescendant("game", "canvas");
	}
	
}

class HUD { //class for hud graphical overlay. (Output)
	
	constructor(aggregator, settings, builder){
		this.settings = settings
		this.aggregator = aggregator;
		this.playerNumber = 0; //so that panel knows what table size stats to show
		this.createHUDdiv();
		//this.activeStatsPanelIDs = [];
		this.waitForGameToLoad();
		this.builder = builder; //to pass seat number to
	}
	
	initializeHUD(){
		
		//console.log(settings.statsToShow);
		this.windowVariables = this.retrieveWindowVariables(["game.n_seats"]);
		this.n_seats = this.windowVariables["game.n_seats"];
		this.builder.setSeatNumber(this.n_seats);
		this.players = this.retrievePlayerData(this.n_seats);
		//this.aggregator.playerNames = this.players;
		this.display(this.players, this.settings);
		
		
	}
	
	createHUDdiv(){
		
		var div = document.createElement("div");
		div.id = "HUD";
		document.body.appendChild(div);
		
	}
	
	HUDloop(){
		
		this.sleep(500).then(() => {
			if(this.settings.checkIfShowingHUD()){
				getStats(this.aggregator); //every update of the HUD retrieve stats from memory and store them in the aggregator stats variable
				this.initializeHUD();
			}else{this.clearDisplay();}
			this.HUDloop();
		})
		
	}
	
	sleep(ms) { //https://www.sitepoint.com/delay-sleep-pause-wait/
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	getVariableStatus(variable){
		
		var scriptContent = "$('body').attr('"+variable+"', JSON.stringify("+variable+" !== null));\n";//"$('body').attr('gameLoaded', JSON.stringify(typeof game !== 'undefined'));\n"
		
		var script = document.createElement('script');
		script.id = 'tmpScript';
		script.appendChild(document.createTextNode(scriptContent));
		(document.body || document.head || document.documentElement).appendChild(script);
		
		var result = $.parseJSON($("body").attr(variable));
		$("body").removeAttr(variable);

		$("#tmpScript").remove();
		return result;
		
	}
	
	async waitForVariableToLoad(variable){
		var self = this; //"this" is not available in the promise because async stuff runs in the context of the window
		var loaded = await new Promise(function(resolve, reject){
			console.log("checking");
			try{
				var variableLoaded = self.getVariableStatus(variable);
			}catch{reject("rip")}
			console.log(variableLoaded);
			
			if(!variableLoaded){
				self.sleep(500).then(() => { 
					resolve(self.waitForVariableToLoad(variable));//should resolve down stack
				})
			}
			if(variableLoaded){resolve(true);}
		})
		console.log("loaded: "+String(loaded));
		return loaded;
	}
	
	async waitForGameToLoad(){
		
		//if(!gameLoaded){this.sleep(500).then(() => { this.waitForGameToLoad(); });}
		var gameLoaded = await this.waitForVariableToLoad("game");//.then(this.waitForVariableToLoad("game.players")).then(this.initializeHUD());
		var playersLoaded = await this.waitForVariableToLoad("game.players");
		this.HUDloop();
		//self.sleep(300).then(() => {this.initializeHUD();});//give a moment for players to fill
		
		return;
		
	}
	
	clearDisplay(){
		var HUDdiv = document.getElementById("HUD");
		HUDdiv.innerText = ""; //remove all panels
	}
	
	display(players, settings){
		
		/* for(var i=0; i<players.length; i++){//delete last panel
			var player = players[i];
			var ID = player.username+"Stats";
			this.removeDisplay(ID);
		}
		for(var i=0; i<this.activeStatsPanelIDs.length; i++){ //delete panel if someone stands. Seems i need this loop and above loop for code to function properly
			var ID = this.activeStatsPanelIDs[i];
			this.removeDisplay(ID);
		}
		console.log(this.activeStatsPanelIDs); */
		var HUDdiv = document.getElementById("HUD");
		HUDdiv.innerText = ""; //remove all panels
		this.playerNumber = 0;
		for(var i=0; i<players.length; i++){
			var player = players[i];
			if(!(player.username == null)){
				this.playerNumber++;
			}
		}
		for(var i=0; i<players.length; i++){ //add new panels
			var player = players[i];
			if(!(player.username == null)){
				this.createDisplay(player, settings);
			}
		}
	}
	
	/* removeDisplay(ID){
		var element = document.getElementById(ID);
		if(element !== null){
			element.parentNode.removeChild(element);
		}
		this.activeStatsPanelIDs.splice(this.activeStatsPanelIDs.indexOf(ID), 1);
	} */
	
	createDisplay(player, settings){
		
		var panel = new Panel(player, this.aggregator, this.playerNumber, settings);
		var HUDdiv = document.getElementById("HUD");
		var div = panel.div;
		//var div = document.createElement("div"); //"<div id='stats' style='position: abosolute; top: '"+translatedY+"; left: "+translatedX+";>HELLO</div>"
		//var node = document.createTextNode("This is new. ");
		//div.appendChild(node);
		//if(!this.activeStatsPanelIDs.includes(ID)){
		//this.activeStatsPanelIDs.push(ID);
		//}
		HUDdiv.appendChild(div);

	}
	
	retrieveWindowVariables(variables) { //refactor
		var ret = {};

		var scriptContent = "";
		for (var i = 0; i < variables.length; i++) {
			var currVariable = variables[i];
			scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', JSON.stringify(" + currVariable + "));\n"
		}

		var script = document.createElement('script');
		script.id = 'tmpScript';
		script.appendChild(document.createTextNode(scriptContent));
		(document.body || document.head || document.documentElement).appendChild(script);

		for (var i = 0; i < variables.length; i++) {
			var currVariable = variables[i];
			ret[currVariable] = $.parseJSON($("body").attr("tmp_" + currVariable));
			$("body").removeAttr("tmp_" + currVariable);
		}

		 $("#tmpScript").remove();

		return ret;
	}
	
	retrievePlayerData(n_seats) { //origionally from https://stackoverflow.com/questions/3955803/chrome-extension-get-page-variables-in-content-script
		var players = [];

		var scriptContent = "";
		for (var i = 0; i < n_seats; i++) {
			var currVariable = "game.players["+String(i)+"].x";
			scriptContent += "$('body').attr('tmp_x_" + String(i) + "', JSON.stringify(" + currVariable + "));\n";
			var currVariable = "game.players["+String(i)+"].y";
			scriptContent += "$('body').attr('tmp_y_" + String(i) + "', JSON.stringify(" + currVariable + "));\n";
			var currVariable = "game.players["+String(i)+"].nm"; //name
			scriptContent += "$('body').attr('tmp_nm_" + String(i) + "', JSON.stringify(" + String(currVariable) + "));\n";
		}

		var script = document.createElement('script');
		script.id = 'tmpScript';
		script.appendChild(document.createTextNode(scriptContent));
		(document.body || document.head || document.documentElement).appendChild(script);

		for (var i = 0; i < n_seats; i++) {
			var currVariable = "game.players["+String(i)+"].x";
			var x = $.parseJSON($("body").attr("tmp_x_" + String(i)));
			$("body").removeAttr("tmp_x_" + String(i));
			var currVariable = "game.players["+String(i)+"].y";
			var y = $.parseJSON($("body").attr("tmp_y_" + String(i)));
			$("body").removeAttr("tmp_y_" + String(i));
			var currVariable = "game.players["+String(i)+"].nm";
			var nm = $.parseJSON($("body").attr("tmp_nm_" + String(i)));
			$("body").removeAttr("tmp_nm_" + String(i));
			players.push(new Player(nm, x, y, i));
		}

		 $("#tmpScript").remove();

		return players;
	}
	
}

class HandBuilder{ //gets called by execute()
	
	constructor(aggregator, settings){
		
		this.aggregator = aggregator;
		this.you = this.getYou();
		this.aggregator.setYou(this.you);
		console.log(this.you);
		this.currentHand = [""];
		this.currentHandForLogging = [""]; //includes "revealed lines"
		this.dealtLine = "";
		this.handNumber = 0;
		this.hands = [];
		this.recordingHands = false;
		this.stackLines = [];
		this.seatNumber;
		this.settings = settings;
		/* this.statsAggregator = new Aggregator();
		getStats(this.statsAggregator); //gets stats from memory */
        this.sentHistorySizeAlert = false;
		
	}
	
	getYou(){  //gets users username from a spot in the code. May need changing if code changes
		
		var html = document.body.innerHTML;
		var nameIndex = html.search(/var tag = \(data\.player\.username == /i) + "var tag = (data.player.username == ".length + 1;
		var slicedHTML = html.slice(nameIndex, html.length);
		var endNameIndex = slicedHTML.search("\"") + nameIndex;
		var username = html.slice(nameIndex, endNameIndex);
		return username;
		
	}
	
	addHand(lines){
		
		this.currentHand = [""]; //reset log for a new hand
		this.currentHandForLogging = [""];
		//this.stackLines = [""];
		var lastHand = this.extractLastHand(lines);
		console.log(lastHand.slice());
		
		var previousLastLine = "";
		for(var i = 0; i<lastHand.length; i++){
			var lastLine = lastHand[i];
			if(!(lastLine == previousLastLine)){
				var lineWords = lastLine.split(" ");
				if(lineWords[0] === "you"){lastLine = lastLine.replace("you", this.you);} //translate you to username of user
				//this.currentHandForLogging.push(lastLine);
				if(lastLine.includes("timed out")){lastLine = lastLine.replace("timed out and ", "");} //removing "timed out and " leaves only the username and "folded". translates to a basic folded message
				if(lastLine.includes("were dealt")){this.dealtLine = lastLine; console.log(lastLine);} //could be useful later
				if(lastLine.includes("(") && !lastLine.includes("showed")){ //if there's a parenthasis and it wasn't from a showed statement
					this.stackLines.push(lastLine);
					console.log(this.stackLines);
				}
				if(!lastLine.includes("came through") && !lastLine.includes("added on") && !lastLine.includes("were dealt") && !lastLine.includes("stood up") && !(lastLine.includes("(")  && (!lastLine.includes("showed")))){
					if(!lastLine.includes("revealed")){
						this.currentHand.push(lastLine);
					}
					this.currentHandForLogging.push(lastLine);
					console.log(lastLine);
				}
				previousLastLine = lastLine;
			}
		}
		
		this.currentHand[0] = this.stackLines.length.toString()+" players are in the hand";
		this.currentHandForLogging[0] = this.stackLines.length.toString()+" players are in the hand";
		console.log(this.currentHand);
		this.createHand(this.currentHand, this.dealtLine); //passes list of hand lines
		if(this.recordingHands){
			console.log("record");
			this.updateHands(); // gets array of hands. again must be done every hand in case user is multitabling //storeHandHistory now gets called from inside updateHands to ensure correct function call order
		}else{this.cleanup();}
		this.currentHand = [""]; //reset log for a new hand
		
	}
	
				/* while(inPlayerLines){
					var currentLine = lines[lines.length-currentLineOffset];
					if(currentLine.includes("(") && (!currentLine.includes(":"))){ //if there's a parenthasis and no one said it in the chat
						currentLineOffset++;
						stackLines.push(currentLine);
					}
					else{
						inPlayerLines = false;
					}
					console.log(currentLine);
					console.log(currentLineOffset);
				}
				var players = currentLineOffset - 2;
				for(var i = stackLines.length-1; i > -1; i--){ //since we added the stacklines going up the chat we have to reverse the order
					builder.addLine(stackLines[i].replace(" are in the hand.", "")); //send to hand builder and strip out " are in the hand cause that confuses it"
				}
				lastLine = players.toString() + " players are in the hand" */
	
	extractLastHand(lines){
		
		var handStart;
		var handEnd;
		for(var i=lines.length-2; i>0; i--){ //get hand end
			if( ! lines[i].includes("(") ){ //once we get out of the stack lines
				console.log(lines[i]);
				handEnd = i;
				break;
			}
		}
		for(var i=lines.length-3; i>0; i--){ //get hand start
			if( lines[i].includes("are in the hand") ){ 
				for(var j = i; j>0; j--){
					var currentLine = lines[j];
					if(!currentLine.includes("(")){ //if there's not a parenthasis
						handStart = j+1;
						break;
					}
				}
				break;
			}
		}
		console.log(handStart);
		console.log(handEnd);
		console.log();
		var handLines = lines.slice(handStart,handEnd+1);
		console.log(handLines.slice());
		return handLines;
		
	}
	
	/* addLine(lastLine){
		if(lastLine == null){return;} //for some reason nulls sometimes get passed here.
		var lineWords = lastLine.split(" ");
		if(lineWords[0] === "you"){lastLine = lastLine.replace("you", this.you);} //translate you to username of user
		if(lastLine.includes("timed out")){lastLine = lastLine.replace("timed out and ", "");} //removing "timed out and " leaves only the username and "folded". translates to a basic folded message
		if(lastLine.includes("are in the hand")){ //if its the start of a new hand 
			if(this.currentHand[0].includes("are in the hand")){ //and if there is a complete hand logged. then create a hand object
				if( ! (this.currentHand.length < 2)){ //oh and also if it's not just one line in the hand, cause i can get the same line twice
					console.log(this.currentHand);
					this.createHand(this.currentHand, this.dealtLine); //passes list of hand lines
					if(this.recordingHands){
						this.storeHandHistory();
					}
				}
			}
			this.currentHand = []; //reset log for a new hand
			this.currentHandForLogging = [];
			this.dealtLine = "";
			console.log(this.stackLines);
			this.stackLines = [];
		}
		if(lastLine.includes("were dealt")){this.dealtLine = lastLine; console.log(lastLine);} //could be useful later
		if(lastLine.includes("(") && (!lastLine.includes(":")) && (!lastLine.includes("showed"))){ //if there's a parenthasis and no one said it in the chat
			this.stackLines.push(lastLine);
			console.log(this.stackLines);
		}
		if(!lastLine.includes("came through") && !lastLine.includes("added on") && !lastLine.includes("were dealt") && !lastLine.includes("stood up") && !(lastLine.includes("(") && (!lastLine.includes(":"))  && (!lastLine.includes("showed")))){
			if(this.currentHand[this.currentHand.length-1]==lastLine && !(this.currentHand.length == 0)){//check if line has already been logged
				return;
			}
			if(lastLine.includes("posted") && this.currentHand[this.currentHand.length-2] == lastLine){ //if its the blinds we have to check to lines back to see if its duplicate because the blinds take up two lines with a single mutation
				return;
			}
			if(!lastLine.includes("revealed")){
				this.currentHand.push(lastLine);
			}
			this.currentHandForLogging.push(lastLine);
			console.log(lastLine);
		}
		if(lastLine.includes("won")){ //do this here because we know a new hand will start and we want a moment to grab from memory before logging happens
			console.log("update handNumber");
			//this.updateHandNumber(); //get handNumber from memory. important to check for updates each time in case multitabling
			this.updateHands(); // gets array of hands. again must be done every hand in case user is multitabling
			this.recordingHands = settings.checkIfRecordingHands()
		}
		
	} */
    
    cleanup(){
        
        console.log("cleanup");
		this.currentHandForLogging = [""]; //these must all be cleared after the history string is created
		this.dealtLine = "";
		this.stackLines = [];
        
    }
	
	storeHandHistory(){
		
        if(this.hands.length >= 2000){
            var haveAlerted = this.sentHistorySizeAlert;
            if(!haveAlerted){
                chrome.runtime.sendMessage({"command": "AlertHandHistorySize"}, function(response) {
                    console.log(response.confirmation);
                });
                this.sentHistorySizeAlert = true;
            }
            this.cleanup();
            return;
        }else{this.sentHistorySizeAlert = false;}
        
		console.log("brapapa");
		try{
			var logString = this.convertToPokerStarsFormat(this.currentHandForLogging, this.dealtLine, this.stackLines);
		}catch{
			console.log("something went wrong logging the hand");
			var logString = "";
		}
        this.cleanup();
		this.handNumber += 1;
		console.log(logString);
		var self = this;
		/* chrome.storage.local.get(['hands'], function(result) {
			console.log('Value currently is ' + result.hands);
			self.hands = result.hands;
		}); */
		this.hands.push(logString);
		chrome.storage.local.set({"hands": self.hands}, function() {
			console.log("updated hands");
		});
		/* console.log(this.handNumber);
		chrome.storage.local.set({"handNumber": self.handNumber}, function() {	
			console.log('Value is set to ' + self.handNumber);
		}); */
		
	}
	
	/* updateHandNumber(){ //setting this.handNumber to what it currently is
		
		var self = this;
		chrome.storage.local.get(['handNumber'], function(result) {
			console.log('Value currently is ' + result.handNumber);
			//self.setStatsToShow(result.settings.stats);
			var hn = result.handNumber;
			//console.log(result.settings.stats);
			if(Number.isNaN(hn)){hn = 0; console.log("whaaat");}
			self.handNumber = hn;
		});
		
	} */
	
	updateHands(){ //setting this.handNumber to what it currently is
		
		var self = this;
		chrome.storage.local.get(['hands'], function(result) {
			self.hands = result.hands;
			self.storeHandHistory();
		});
		
	}
	
	setSeatNumber(n){
		this.seatNumber = n;
	}
	
	convertToPokerStarsFormat(handLines, dealtLine, stackLines){
		
		console.log(handLines.slice());
		console.log(dealtLine);
		console.log(stackLines.slice());
		
		var history = "";
		
		var sb = handLines[1].split(" ")[2];
		var bb = handLines[2].split(" ")[2];
		var date = new Date();
		var year = date.getFullYear().toString();
		var month = (date.getMonth() + 1).toString();
		if(month.length == 1){month = "0"+month;}
		var day = date.getDate().toString();
		if(day.length == 1){day = "0"+day;}
		var hour = date.getHours().toString();
		if(hour.length == 1){hour = "0"+hour;}
		var minute = date.getMinutes().toString();
		if(minute.length == 1){minute = "0"+minute;}
		var second = date.getSeconds().toString();
		if(second.length == 1){second = "0"+second;}
		var timezone = date.toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
		
		history = "Hold'em No Limit ("+sb+"/"+bb+") - "+year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second+' '+timezone+'\n'
		
		var tabTitle = document.getElementsByTagName('title')[0].innerHTML;
		var tableName = tabTitle.slice(0,tabTitle.length-" - donkhouse.com".length);
		var seatNumber = this.seatNumber;
		console.log(seatNumber);
		var buttonSeatNumber;
		var buttonAbbrv = "BU)"; //parenthasis is included so that someone with BU in their name won't trigger a false positive
		if(stackLines.length == 2){
			buttonAbbrv = "SB)"; //when headsup the chat says SB instead of BU
		}
		for(var i=0; i<stackLines.length; i++){
			var line = stackLines[i];
			if(line.includes(buttonAbbrv)){
				buttonSeatNumber = i+1;
			}
		}
		
		history = history + "Table '"+ tableName +"' "+seatNumber.toString()+"-max Seat #"+buttonSeatNumber.toString()+" is the button\n"
		
		for(var i=0; i<stackLines.length; i++){
			var line = stackLines[i];
			var seat = i+1;
			var username = line.split(" ")[0];
			var chips = line.split(" ")[1].slice(1, line.split(" ")[1].length-1);
			history = history + "seat "+seat.toString()+": "+username+" ("+chips+" in chips)\n";
		}
		
		var sbUser = handLines[1].split(" ")[0];
		var sbSize = handLines[1].split(" ")[2];
		
		history = history + sbUser + ": posts small blind "+sbSize+"\n";
		
		var bbUser = handLines[2].split(" ")[0];
		var bbSize = handLines[2].split(" ")[2];
		
		history = history + bbUser + ": posts big blind "+bbSize+"\n";
		
		if(dealtLine != ""){
			history = history + "*** HOLE CARDS ***\n";
			
			var selfUsername = dealtLine.split(" ")[0];
			var firstCard = this.replaceSymbol(dealtLine.split(" ")[3]);
			var secondCard = this.replaceSymbol(dealtLine.split(" ")[4]);
			
			history = history + "Dealt to " + selfUsername + " [" +firstCard+" "+secondCard+ "]\n";
		}
		
		var street = 0;
		var firstShow = true;
		for(var i = 3; i<handLines.length; i++){
			var line = handLines[i]; // needs to not affect hand history
			if(line.includes("showed") && firstShow){
				history = history + "*** SHOW DOWN ***\n";
				firstShow = false;
			}
			if(line.includes("board")){
				history = history + this.translateBoard(line, street);
				street+=1;
			}else{
				history = history + this.translateAction(line);
			}
		}
		
		return history;
		
	}
	
	translateBoard(line, street){
		var line = this.replaceSymbol(line);
		var streets = ["FLOP", "TURN", "RIVER"];
		var streetSizes = {0:[7, 15], 1:[16, 18], 2:[19, 21]};
		
		var boardLine = "*** " + streets[street] + " ***"
		
		var lastChop = 0; // for use in double board situations
		for(var i=0; i<street+1; i++){
			console.log(i);
			boardLine = boardLine + " [";
			var chopStart = streetSizes[i][0];
			var chopEnd = streetSizes[i][1];
			lastChop = chopEnd;
			boardLine = boardLine + line.slice(chopStart, chopEnd);
			boardLine = boardLine + "]";
		}
		
		if(line.includes("/")){ //if it's ran twice or is a double board
			boardLine = boardLine + " / ";
			lastChop = lastChop + " / ".length - streetSizes[0][0];
			for(var i=0; i<street+1; i++){
				boardLine = boardLine + " [";
				var chopStart = streetSizes[i][0] + lastChop;
				var chopEnd = streetSizes[i][1] + lastChop;
				boardLine = boardLine + line.slice(chopStart, chopEnd);
				boardLine = boardLine + "]";
			}
		}
		
		boardLine = boardLine + "\n";
		
		return boardLine;
	}
	
	translateAction(line){
		var username = line.split(" ")[0];
		var action = line.split(" ")[1];
		var newAction = "";
		if(action == "bet"){newAction = "bets " + line.split(" ")[2];}
		else if(action == "called"){newAction = "calls " + line.split(" ")[2];}
		else if(action == "checked"){newAction = "checks";}
		else if(action == "folded"){newAction = "folds";}
		else if(action == "raised"){newAction = "raises to " + line.split(" ")[3];}
		else if(action == "mucked"){newAction = "mucks hand";}
		else if(action == "revealed"){newAction = "reveals " + this.replaceSymbol(line.slice(username.length+action.length+2,line.length));}
		else if(action == "showed"){
			var firstCard = this.replaceSymbol(line.split(" ")[2]);
			var secondCard = this.replaceSymbol(line.split(" ")[3]);
			newAction = "shows [" + firstCard + " " + secondCard + "]";
		}
		else if(action == "won"){newAction = "wins " + line.split(" ")[2];}
		
		var translatedLine = username+": " + newAction + "\n";
		return translatedLine;
	}
	
	replaceSymbol(card){
		var card = card;
		card = card.replaceAll("10", "T");
		card = card.replaceAll("♥", "h");
		card = card.replaceAll("♦", "d");
		card = card.replaceAll("♠", "s");
		card = card.replaceAll("♣", "c");
		return card;
	}
	
	createHand(handLines){
		
		this.aggregator.requestServerAnalysis(handLines);
		
	}
	
}

/* function store(key, value){ //for stats dict: key is player, value is {statName:statValue}. I think this function is never called?
	
	chrome.storage.local.set({key: value}, function() { 
		console.log(key + ' is set to ' + value);
	});
	
} */

function getStats(aggregator){
	
	chrome.storage.local.get(["stats"], function(result) {
		aggregator.stats = result["stats"];//["stats"];
		//console.log("STATS");
		//console.log(aggregator.stats);
		//console.log(JSON.stringify(aggregator.stats));
		aggregator.unpackStats();
	});
	
}

class Aggregator{
	
	constructor(){
		
		this.stats = {};
		this.you = "";
	
	}
	
	setYou(you){
		this.you = you;
	}
    
    handed(hand){
		var number = 0;
        if (parseInt(hand, 10) === hand){ //if an int is input
            number = hand;
		}
        else{
            number = parseInt(hand.playerNumber, 10);
		}
        if (number == 2){
            return "heads up";
		}
        if (number > 2 && number < 7){
            return "short handed";
		}
        if (number > 6 || number == 1){
            return "full ring";
		}
	}
	
	/* getNumberOfHands(username, tableSize){
		
		var data = this.getData(this.stats["VPIP"], tableSize, username);
		return data[1];
		
	} */
	
	getData(dataDict, tableSize, player){ //get list representation of the data from a path of player and . player argument is username, not a Player object
		dataDict = this.makePath(dataDict, tableSize, player);
		return dataDict[player][tableSize];
	}
	
	makePath(dataDict, tableSize, player){
		if(dataDict == null){
			dataDict = {};
		}
		if (! Object.keys(dataDict).includes(player)){
			dataDict[player] = {};
		}
		if (! Object.keys(dataDict[player]).includes(tableSize)){//{player:{tableSize:[handsPlayed, totalHands]}}
			dataDict[player][tableSize] = [0,0];
		}
		return dataDict;
	}
	
	getStat(statName, dataDict, tableSize, username){  
		
		var percentStats = ["VPIP", "PFR", "3B", "4B", "F3", "WTSD", "CB", "2B", "3Ba", "FC", "F2B", "F3B"];//stats that are represented as a percent
		var nonPercentStats = ["AF", "H"];
		
		var data = this.getData(dataDict, tableSize, username);
		var string = "";
		if(statName == "H"){
			string = "("+data[1]+")"
		}else if(percentStats.includes(statName)){
			string = ((data[0]/data[1])*100).toFixed(1);
		}else{
			string = (data[0]/data[1]).toFixed(2);
		}
		return string;
		
	}
	
	/* printStats(tableSize, players){
		
		var statKeys = Object.keys(this.stats);
		var handPlayers = [...players];
		var dict = {};
		
		for(var i=0; i<statKeys.length; i++){
			var stat = statKeys[i]; //stat name
			var statData = this.stats[stat]; //data in stat name (dict with keys as player data)
			for(var j=0; j<Object.keys(statData).length; j++){
				var player = Object.keys(statData)[j];
				if(!Object.keys(dict).includes(player)){
					dict[player] = [];//[this.stats["VPIP"][player][tableSize][1]];
				}
				try{
					dict[player].push(stat +": "+ String(statData[player][tableSize][0]/statData[player][tableSize][1]));
				}catch{}
			}
		}
		for(var i=0; i<players.length; i++){
			var player = players[i];
			console.log(player);
			console.log(dict[player]);
		}
		
	} *///////
	
	allStats(){
	//return {"VPIP":this.VPIPdata, "PFR":this.PFRdata, "AF": this.AFdata, "3B":this.threeBetData, "4B":this.fourBetData, "F3":this.F3data, "WTSD":this.WTSDdata, "CB":this.CBdata, "2B":this.twoBarrelData, "3B":this.threeBarrelData, "FC":this.FCdata, "F2":this.F2Bdata, "F3B":this.F2Bdata};
		return ["H", "VPIP", "PFR", "AF", "3B", "4B", "F3", "WTSD", "CB", "2B", "3Ba", "FC", "F2B", "F3B"];
	}
	
	unpackStats(){
		
		var statKeys = Object.keys(this.stats);
		var statList = this.allStats();
		
		for(var i=0; i<statList.length; i++){ 
			var stat = statList[i]
			if(!statKeys.includes(stat)){//make empty directory for every stat that doesn't exist yet
				this.stats[statList[i]] = {};
			}
		}
		this.HandsData = this.stats["H"];
		this.VPIPdata = this.stats["VPIP"];  //{player:{tableSize:[handsPlayed, totalHands]}}
        this.PFRdata = this.stats["PFR"];
        this.AFdata = this.stats["AF"]; //{player:{tableSize:[aggressiveActions, actions]}}
		this.threeBetData = this.stats["3B"];
		this.fourBetData = this.stats["4B"];
		this.F3data = this.stats["F3"];
		this.WTSDdata = this.stats["WTSD"];
		this.CBdata = this.stats["CB"];
		this.twoBarrelData = this.stats["2B"];
		this.threeBarrelData = this.stats["3Ba"];
		this.FCdata = this.stats["FC"];
		this.F2Bdata = this.stats["F2B"];
		this.F3Bdata = this.stats["F3B"];
		
	}
	
	packStats(HandsData, VPIPdata, PFRdata, AFdata, threeBetData, fourBetData, F3data, WTSDdata, CBdata, twoBarrelData, threeBarrelData, FCdata, F2Bdata, F3Bdata){
		
		this.stats["H"] = HandsData;
		this.stats["VPIP"] = VPIPdata;
		this.stats["PFR"] = PFRdata;
		this.stats["AF"] = AFdata;
		this.stats["3B"] = threeBetData;
		this.stats["4B"] = fourBetData;
		this.stats["F3"] = F3data;
		this.stats["WTSD"] = WTSDdata;
		this.stats["CB"] = CBdata;
		this.stats["2B"] = twoBarrelData;
		this.stats["3Ba"] = threeBarrelData;
		this.stats["FC"] = FCdata;
		this.stats["F2B"] = F2Bdata;
		this.stats["F3B"] = F3Bdata;
		
		console.log(this.stats);
		
	}
	
	storeStats(HandsData, VPIPdata, PFRdata, AFdata, threeBetData, fourBetData, F3data, WTSDdata, CBdata, twoBarrelData, threeBarrelData, FCdata, F2Bdata, F3Bdata){ 
		if(arguments.length > 0){ //if dicts got passed in as args then they need packing. otherwise we are just storing the current stats dict (which we do when restoring and assimilating dicts)
			this.packStats(HandsData, VPIPdata, PFRdata, AFdata, threeBetData, fourBetData, F3data, WTSDdata, CBdata, twoBarrelData, threeBarrelData, FCdata, F2Bdata, F3Bdata); //packs stats into this.stats
		}
		chrome.storage.local.set({"stats": this.stats}, function() {
			console.log('Value is set to ' + this.stats);
		});
		
	}
	
	requestServerAnalysis(handLines){
		
		chrome.runtime.sendMessage({"handLines": handLines, "stats": this.stats, "command": "requestServerAnalysis", "you": this.you}, function(response) {
			console.log(response.confirmation);
		});
		
	}
	
	assimilate(newData){
		var nativeStats = this.stats;
		var dataStats = Object.keys(newData);
		dataStats.forEach(function(stat){
			var statData = dataStats.stat;
			Object.keys(statData).forEach(function(name){
				var nameData = statData.name;
				Object.keys(nameData).forEach(function(tableSize){
					var data = nameData.tableSize();
					var nativeDataDict = nativeStats.stat;
					var nativeDataPoint = getData(nativeDataDict, tableSize, name);
					var newDataPoint = newData.stat.name.tableSize;
					var assimilatedDataPoint = [nativeDataPoint[0]+newDataPoint[0], nativeDataPoint[1]+newDataPoint[1]];
					this.stats.stat.name.tableSize = assimilatedDataPoint;
				})
			})
		})
	}
	
}

function removeChat(chatText){
	
	var jHtmlObject = jQuery("<p>"+chatText);
	var editor = jQuery("<p>").append(jHtmlObject);
	editor.find(".speech_container_yyy").remove();
	var newHtml = editor.html();
	var activityText = newHtml;
	return activityText;
	
}

function seperateIntoLines(chat){
	
	var chatLines = chat.split("<br>");
	for(var i=0; i<chatLines.length; i++){
		chatLines[i] = chatLines[i].replace(/(<([^>]+)>)/ig,"");
	}
	return chatLines;
	
};

const callback = function(mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
	var lastMutation;
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
			var chatText = document.getElementById('cht_bx').innerHTML;
			var activityText = removeChat(chatText);
			var lines = seperateIntoLines(activityText);
			var lastLine = lines[lines.length-2];
			/*if(lastLine.includes("posted")){ //if its the blinds send the hand builder the second to last line as well, because the blinds are both posted as a single mutation
				builder.addLine(lines[lines.length-3]);
			}*/
			if(!(lastLine == null)){
				if(lastLine.includes("are in the hand") && !arraysEqual(lines, lastMutation)){
					console.log("very good");
					builder.addHand(lines);
				}
				
				if(lastLine.includes("won")){ //do this here because we know a new hand will start and we want a moment to grab from memory before logging happens
					//this.updateHandNumber(); //get handNumber from memory. important to check for updates each time in case multitabling
					builder.recordingHands = settings.checkIfRecordingHands()
				}
				//}catch{}
				lastMutation = lines.slice(); //copy last chat state to make sure we don't get double triggered by a line
			}
        }
    }
};

function arraysEqual(a, b) { //https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length !== b.length) return false;

	// If you don't care about the order of the elements inside
	// the array, you should sort both arrays here.
	// Please note that calling sort on an array will modify that array.
	// you might want to clone your array first.

	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

function sleep(ms) { //https://www.sitepoint.com/delay-sleep-pause-wait/
	return new Promise(resolve => setTimeout(resolve, ms));
}

var aggregator = new Aggregator();
getStats(aggregator); //gets stats from memory

var settings = new Settings();

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.command == "updateStats2"){ //updateStats2 is from background.js to content.js wheras updateStats is from popup.js to background.js
			settings.statsToShow = request.stats;
			sendResponse({"confirmation": "success"});
		}
		if (request.command == "record2"){ //updateStats2 is from background.js to content.js wheras updateStats is from popup.js to background.js
			settings.record = request.state;
			sendResponse({"confirmation": "success"});
		}
		if(request.command == "restore"){
			console.log("restore");
			console.log(request.stats);
			aggregator.stats = JSON.parse(request.stats);
			console.log(aggregator.stats);
			aggregator.storeStats();
			sendResponse({"confirmation": "success"});
		}
		if(request.command == "assimilate"){
			console.log("assimilate");
			aggregator.assimilate(JSON.parse(request.stats));
			aggregator.storeStats();
			sendResponse({"confirmation": "success"});
		}
		if(request.command == "cleared"){
			console.log("cleared");
			getStats(aggregator);
			sendResponse({"confirmation": "success"});
		}
		/*if(request.command == "serverUpdate"){
			console.log("server!");
			aggregator.stats = request.stats;
			console.log(aggregator.stats);
			sendResponse({"confirmation": "success"});
		}*/
	}
);

var builder = new HandBuilder(aggregator, settings);
var hud = new HUD(aggregator, settings, builder);
// Create an observer instance linked to the callback function
const chatObserver = new MutationObserver(callback);

//Start observing the target node for configured mutations
chatObserver.observe(targetNode, config);

function tester(lineNumber){
	var lines = document.documentElement.innerHTML.replace(/(<([^>]+)>)/ig,"").split("\n");
	var line = lines[lineNumber];
	builder.addLine(line);
	if(lineNumber < lines.length-1){
		sleep(100).then(() => { tester(lineNumber+1); });
	}
}

//execute();
//sleep(1000).then(() => { tester(0); })

//"https://donkhouse.com/group/*/*"
//file:///C:/Users/ethan/OneDrive/Documents/code/chromeExtensions/test/index.txt
