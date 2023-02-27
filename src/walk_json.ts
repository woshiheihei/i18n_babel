import * as fs from 'fs';
import * as path from 'path';
import * as babel from "@babel/core"
import plugin from './i18n_plugin'
// 定义 search_string_in_folder 函数类型
type SearchStringInFolderFn = (searchStr: string, folderPath: string, replaceStr: string) => void;

let cache: Record<string, string> = {};

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
      // 如果是文件则判断是否为 .js 文件
      if (!file.endsWith('.js')) continue;
      // 拼出文件的绝对路径
      const filePath = path.join(folderPath, file);
      // filePath 缓存到cache中
      if (!cache[filePath]) cache[filePath] = fs.readFileSync(filePath, 'utf-8');
      // 读取文件内容
      let content = cache[filePath];

      try {
        const result = babel.transform(content, {
          babelrc: false,
          ast: true,
          plugins: [plugin(searchStr, replaceStr, 0.6), "@babel/plugin-syntax-jsx", ["@babel/plugin-proposal-decorators", { "legacy": true }]],
          // presets: ["@babel/preset-react"],
          configFile: false,
        })
        if (!result?.code) return;
        // result.code 写入到缓存中
        cache[filePath] = result.code;
      } catch (error) {
        console.log('error: ', error);
      }

    }
  }
}


// 打开并读取 zh.json 文件
const filePath = path.join(__dirname, 'zh.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const folderPath = '/home/tavimercy/code/tavi-as/tavi-as-customer-frontend/platform/tavi/src/view/studyList/hooks';
// const folderPath = '/home/weibao/code/ts/i18n_babel/test';


// 遍历字典对象
for (const [key, value] of Object.entries(data)) {
  const searchStr = value as string;
  let replaceStr = key;
  search_string_in_folder(searchStr, folderPath, replaceStr);
}

// 遍历缓存，将缓存中的内容写入到文件中
console.log("start to write file");
for (const [key, value] of Object.entries(cache)) {
  console.log("start to write file: ", key);
  fs.writeFileSync(key, value);
}


