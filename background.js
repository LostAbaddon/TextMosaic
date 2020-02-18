var MosaicType = { rearrange: true };
var SensWords = {};

const ExpSep = /[ \t\r　，。‘’“”《》【】：；—（）￥！？、<>\(\)\[\]\{\}\.,\\\/\?!\&\-\+=$@#`~·…\d的地得a-zA-Z]/gi;
const DefaultSensitiveWords = {
	"政府": "振幅",
	"警察": "敬茶",
	"自由": ["汁油", "职友"],
	"民主": ["冥珠", "明竹"]
};

syncstore.get('MosaicType', type => {
	MosaicType = type;
});
syncstore.get('SensitiveWords', words => {
	if (!words || Object.keys(words).length === 0) {
		syncstore.set({'SensitiveWords': DefaultSensitiveWords});
		SensWords = DefaultSensitiveWords;
	} else {
		SensWords = words;
	}
});

const ToggleMosaic = tabID => {
	chrome.tabs.sendMessage(tabID, {
		action: "launch",
		option: MosaicType
	});
};
const TextMosaic = content => {
	if (MosaicType.replace) content = ReplaceSensWords(content);
	if (MosaicType.rearrange) content = RearrangeArticle(content);

	return content;
};
const mosaic = list => {
	var len = list.length;
	if (len <= 3) return list;
	var bra = list.substr(0, 1), ket = list.substr(len - 1, 1), mid = list.substring(1, len - 1);
	mid = randomize(mid);
	return bra + mid + ket;
};
const ReplaceSensWords = content => {
	Object.keys(SensWords).forEach(key => {
		var reps = SensWords[key];
		if (isString(reps)) reps = [reps];
		while (content.indexOf(key) >= 0) {
			let rep = reps[Math.floor(reps.length * Math.random())];
			content = content.replace(key, rep);
		}
	});
	return content;
};
const RearrangeArticle = content => {
	content = content.split('\n').map(line => {
		var result = '';
		var parts = line.split(ExpSep);
		parts.forEach(l => {
			var len = l.length;
			if (len > 0) l = mosaic(l);
			var sep = line.substr(result.length + len, 1);
			result = result + l + sep;
		});
		result = result.replace(/[a-zA-Z]+/gi, match => {
			return mosaic(match);
		});
		return result;
	});
	content = content.join('\n');

	return content;
};

chrome.commands.onCommand.addListener(cmd => {
	if (cmd === 'toggle-mosaic') {
		chrome.tabs.getSelected(tab => {
			ToggleMosaic(tab.id);
		});
	}
});

chrome.runtime.onMessage.addListener((msg, sender, response) => {
	if (msg.event === 'ChangeMosaicType') {
		MosaicType[msg.option] = msg.value;
		response();
	} else if (msg.event === 'ToggleMosaic') {
		ToggleMosaic(sender.tab);
	} else if (msg.event === 'TextMosaic') {
		response(TextMosaic(msg.content));
	}
});