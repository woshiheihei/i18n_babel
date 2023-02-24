// var distance = require('jaro-winkler');

// const res = distance('hihi', 'MARHTAheiheihie');
// console.log(res);

// 引入natural模块
var natural = require('natural');

// 定义两个字符串
var string1 = '确认删除选中病例 ?';
var string2 = '确认删除选中的病例？';

// 计算Dice系数
var dice = natural.DiceCoefficient(string1, string2);

console.log(dice);

// 打印结果
console.log(dice > 0.6 ? '相似' : '不相似');

function checkSimilarityWithDiceCoefficient(str1, str2, threshold = 0.6) {
  const dice = natural.DiceCoefficient(str1, str2);
  return dice > threshold;
}