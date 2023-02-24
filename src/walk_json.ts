import * as fs from 'fs';
import * as path from 'path';
import * as babel from "@babel/core"
import plugin from './i18n_plugin'
// 定义 search_string_in_folder 函数类型
type SearchStringInFolderFn = (searchStr: string, folderPath: string, replaceStr: string) => void;

// 自定义 search_string_in_folder 函数
const search_string_in_folder: SearchStringInFolderFn = (searchStr, folderPath, replaceStr) => {
  // 读取文件夹下所有文件和子文件夹
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    // 如果是子文件夹则递归调用 search_string_in_folder 函数
    if (stats.isDirectory()) {
      search_string_in_folder(searchStr, filePath, replaceStr);
    } else if (stats.isFile()) {
      // 拼出文件的绝对路径
      const filePath = path.join(folderPath, file);
      const result = babel.transformFileSync(filePath, {
        babelrc: false,
        ast: true,
        plugins: [plugin(searchStr, replaceStr, 0.9), "@babel/plugin-syntax-jsx"],
        // presets: ["@babel/preset-react"],
        configFile: false,
      })
      if (!result?.code) return;
      fs.writeFileSync(filePath, result.code);
    }
  }
}


// 打开并读取 zh.json 文件
const filePath = path.join(__dirname, 'zh.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const folderPath = '/home/ubuntu/code/ts/i18n-babel/test';

// 遍历字典对象
for (const [key, value] of Object.entries(data)) {
  const searchStr = value as string;
  let replaceStr = key;
  search_string_in_folder(searchStr, folderPath, replaceStr);
}


