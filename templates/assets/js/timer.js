function Timer(){
	this.totalSeconds = 0;
	this.on = false;
	var counter;
};

/**
 * If timer is on, then increment time and update timer display in html
**/
Timer.prototype.setTime = function(){
		//increment time and update timer display
		if(this.on == true){
		this.totalSeconds++;
		}
		
		//update timer display
		document.getElementById("seconds").innerHTML = pad(this.totalSeconds % 60);
		document.getElementById("minutes").innerHTML = pad(parseInt(this.totalSeconds / 60 ) % 60);
		document.getElementById("hours").innerHTML = pad(parseInt(this.totalSeconds / 3600));
		
		//adds zeros for better display of time
		function pad(num){
			var numString = num + "";
			if(numString.length < 2){
				//pad with zero for display of time
				return "0" + numString;
			} else {
				//no need for padding
				return numString;
			}
		}
};

/**
 * Turns timer on and starts counting.
 **/
Timer.prototype.start = function(){
	if(this.on ==false){
		this.on = true;
		this.counter = setInterval(
			function(self){
				return function(){
					self.setTime();
				}
			}(this), 1000);
	}
};
	
/**
 * Stops the timer from counting.
**/
Timer.prototype.stop = function(){
	clearInterval(this.counter);
	this.on = false;
};

/**
 * Returns the timer to zero and stops counting
**/
Timer.prototype.resetTime = function(){
	this.totalSeconds = 0;
	clearInterval(this.counter);
	this.on = false;
	this.setTime();
};

/**
 * Toggles timer's state
**/
Timer.prototype.toggle = function(){
	if(this.on == true){
		timer.stop()
	} else {
		timer.start();
	}
};

/**
 * Gets the number of seconds that have passed
 */
Timer.prototype.getTime = function(){
	return this.totalSeconds;
};

/**
 * Check if the timer is on
 */
Timer.prototype.isOn = function(){
	return this.on;
};