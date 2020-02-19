# TextMosaic

将文本打乱给的小工具

- **版本**： 0.1.0
- **作者**： [LostAbaddon](mailto:lostabaddon@gmail.com)
- **网址**： [GitHub](https://github.com/LostAbaddon/TextMosaic)

## 打乱规则

1.	段落顺序不变
2.	以常见标点符号分割而成的断句顺序不变
3.	每个断言内，中文与英文独立打乱
4.	中文和英文字段如果长度不大于3，则保持不变
5.	长度大于3的中文或英文字段，保持首尾两个字符不变，中间字符随机打乱
6.	如果选择敏感词加混淆，则会对敏感词进行替换之后再进行混淆

## 简单加密

加密方式：

1.	UTFX编码：类UTF8的变长编码方式，每个字节后六位为字符，前两位是标记，以11开头，后续都为10，用于分割字符；
2.	BaseX编码：类Base64编码，只是替换规则不同，用于避开简单的Base64编码审核。

## 使用方式

在输入组件中输入文字，然后点击Badge，完成混淆与替换。

触发方式：
-	点击Badge后点“混淆”
-	快捷键：Alt+M
-	键组触发：快速三下ctrl

插件内混淆：点击Badge后在下方输入内容，也可选择进行解密。

可在插件选项页（右键Badge或在插件管理页可看到）中选择混淆方式：

1.	替换（先于乱序）
2.	乱序
3.	简单加密（后于乱序）

## 下一步

-	横竖排转置（可能会做）
-	对当前页内容快捷键解密

## 祝使用愉快