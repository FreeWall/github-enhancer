var Settings = function(){

	this.getStylesEnabled = function(callback){
		chrome.storage.sync.get(['stylesEnabled'],function(result){
			callback(result['stylesEnabled']);
		});
	};

	this.setStylesEnabled = function(enabled){
		chrome.storage.sync.set({stylesEnabled:enabled});
	};
};