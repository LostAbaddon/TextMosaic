// Common Functions

window.wait = () => new Promise(res => setTimeout(res, 0));
window.now = () => Date.now();
window.isString = str => (typeof str === 'string') || (str instanceof String);
window.isNumber = num => (typeof num === 'number') || (num instanceof Number);
window.randomize = array => {
	var isStr = false;
	if (isString(array)) {
		isStr = true;
		array = array.split('');
	}
	var result = [], len = array.length, l = len;
	for (let i = 0; i < len; i ++) {
		result.push(array.splice(Math.floor(Math.random() * l), 1)[0]);
		l --;
	}
	if (isStr) result = result.join('');
	return result;
};