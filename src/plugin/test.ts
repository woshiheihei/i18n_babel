import * as babel from "@babel/core"
import plugin from './babel-plugin-closure-id'
import fs from "fs";


const code = `
import {ref, _createVNode} from 'vue'
import { lexicalScoped, effect }  from '@skedo/lexical-cache'

lexicalScoped('ref')

effect(() => {

}, [])

function foo(){
	ref(0)
	ref(0)
	ref(0)
	ref(0)
}

`

const result = babel.transformSync(code, {
	babelrc: false,
	ast: true,
	plugins : [plugin(null, null, null)],
	sourceMaps: true,
	sourceFileName: "aaa",
	configFile: false
})

fs.writeFileSync("ast_output.json",JSON.stringify(result,null,2))
console.dir(result!.ast)
console.log(result!.code)