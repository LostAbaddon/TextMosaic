const ToggleMosaic = tabID => {
	chrome.tabs.sendMessage(tabID, {
		action: "launch",
		level: 1
	});
};

chrome.browserAction.onClicked.addListener(tab => {
	ToggleMosaic(tab.id);
});

chrome.commands.onCommand.addListener(cmd => {
	if (cmd === 'toggle-mosaic') {
		chrome.tabs.getSelected(tab => {
			ToggleMosaic(tab.id);
		});
	}
});