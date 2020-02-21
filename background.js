var MosaicType = { rearrange: true };
var SensWords = {};
var Encryptor = '';

const ExpSep = /[ \t\r　，。‘’“”《》【】：；—（）￥！？、<>\(\)\[\]\{\}\.,\\\/\?!\&\-\+=$@#`'"~·…\da-zA-Z]/gi;
const DefaultSensitiveWords = {
	"政府": "振幅",
	"警察": "敬茶",
	"自由": ["汁油", "职友"],
	"民主": ["冥珠", "明竹"]
};
const DefaultSimplePassword = 'LostAbaddon';

syncstore.get('MosaicType', type => {
	if (!type || Object.keys(type).length === 0) {
		syncstore.set({ 'MosaicType': MosaicType });
	} else {
		MosaicType = type;
	}
});
syncstore.get('SensitiveWords', words => {
	if (!words || Object.keys(words).length === 0) {
		syncstore.set({'SensitiveWords': DefaultSensitiveWords});
		SensWords = DefaultSensitiveWords;
	} else {
		SensWords = words;
	}
});
syncstore.get('SimplePassword', pwd => {
	if (!pwd || pwd.length === 0) {
		syncstore.set('SimplePassword', DefaultSimplePassword);
		Encryptor = DefaultSimplePassword;
	} else {
		Encryptor = pwd;
	}
});

chrome.storage.sync.onChanged.addListener(item => {
	Object.keys(item).map(key => {
		if (key === 'MosaicType') {
			var option = item[key].newValue;
			MosaicType.replace = option.replace;
			MosaicType.rearrange = option.rearrange;
			MosaicType.encrypt = option.encrypt;
		} else if (key === 'SensitiveWords') {
			SensWords = item[key].newValue;
		} else if (key === 'SimplePassword') {
			Encryptor = item[key].newValue;
		}
	});
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
	if (MosaicType.encrypt) content = SimpleEncrypt(content);

	return content;
};
const mosaic = list => {
	var len = list.length;
	if (len <= 3) return list;
	var bra = list.substr(0, 1), ket = list.substr(len - 1, 1), mid = list.substring(1, len - 1);
	mid = randomize(mid);
	return bra + mid + ket;
};
const cycle = (origin, step, range) => {
	var result = origin + step;
	var s = Math.floor(result / range);
	result -= s * range;
	return result;
};
const SimpleEncrypt = content => {
	var encrypt1 = toUTFX(Encryptor);
	var encrypt2 = baseXS2B(toBaseX(encrypt1));
	var index = 0, last = 0;
	content = toUTFX(content);
	content = content.map(c => {
		var x = encrypt1[index];
		index ++;
		if (index === encrypt1.length) index = 0;
		c = cycle(c, last + x, 256);
		last = c;
		return c;
	});

	content = baseXS2B(toBaseX(content));
	index = encrypt2.length - 1;
	last = 0;
	content = content.map(c => {
		var x = encrypt2[index];
		index --;
		if (index < 0) index = encrypt2.length - 1;
		c = cycle(c, last + x, 64);
		last = c;
		return c;
	});
	content = baseXB2S(content);
	return content;
};
const SimpleDecrypt = content => {
	var encrypt1 = toUTFX(Encryptor);
	var encrypt2 = baseXS2B(toBaseX(encrypt1));
	var index = encrypt2.length - 1, last = 0;
	content = baseXS2B(content);
	content = content.map(c => {
		var x = encrypt2[index];
		index --;
		if (index < 0) index = encrypt2.length - 1;
		var y = cycle(c, 64 - last + 64 - x, 64);
		last = c;
		return y;
	});
	content = fromBaseX(baseXB2S(content));
	index = 0;
	last = 0;
	content = content.map(c => {
		var x = encrypt1[index];
		index ++;
		if (index === encrypt1.length) index = 0;
		var y = cycle(c, 256 - last + 256 - x, 256);
		last = c;
		return y;
	});
	content = fromUTFX(content);
	return content;
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

chrome.contextMenus.create({
	id: 'simple-decrypt',
	title: '解码(ctrl+ctrl+ctrl+d)',
	contexts: [ 'selection' ]
});
chrome.contextMenus.onClicked.addListener(evt => {
	switch (evt.menuItemId) {
		case 'simple-decrypt':
			chrome.tabs.getSelected(tab => {
				chrome.tabs.sendMessage(tab.id, {
					action: "SimpleDecryptLaunchFromContextMenu"
				});
			});
		break;
	}
});

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
	} else if (msg.event === 'SimpleDecrypt') {
		response(SimpleDecrypt(msg.content));
	}
});