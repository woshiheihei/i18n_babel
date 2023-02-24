import * as t from "@babel/types"
import BabelCore from '@babel/core'
import { ref } from "vue"


const plugin = (api: any, options: any, dirname: any) => {
	let searchStr = "添加标签"
	let replaceStr = "add label"

	return {
		name: "closure-id",
		visitor: {
			JSXText: {
				enter: (path: BabelCore.NodePath<t.JSXText>) => {
					// console.log(path.node)
					if (path.node.value === searchStr) {
						path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)])))

					}
				}
			},
			JSXAttribute: {
				enter: (path: BabelCore.NodePath<t.JSXAttribute>) => {
					if (!path.node.value) return;
					if (path.node.value.type === "StringLiteral") {
						if (path.node.value.value === searchStr) {
							path.replaceWith(t.jsxAttribute(path.node.name, t.jsxExpressionContainer(t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)]))))
						}
					}
				}
			},
			CallExpression: {
				enter: (path: BabelCore.NodePath<t.CallExpression>) => {
					if (path.node.arguments.length === 0) return;
					let args = path.node.arguments;
					args.forEach((arg: any) => {
						if (arg.type === "StringLiteral") {
							if (arg.value === searchStr) {
								path.replaceWith(t.callExpression(
									path.node.callee,
									[t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)])]
								))
							}
						}
					})
				}
			}
		}
	}
}
export default plugin