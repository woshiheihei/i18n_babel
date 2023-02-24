import * as t from "@babel/types"
import BabelCore from '@babel/core'
import natural from "natural"

function checkSimilarityWithDiceCoefficient(str1: string, str2: string, threshold = 0.6) {
	const dice = natural.DiceCoefficient(str1, str2);
	return dice > threshold;
}


const plugin = (api: any, options: any, dirname: any) => {
	let searchStr = "添加标签！"
	let replaceStr = "add label"
	let import_react_i18next_flag = false;
	let isReplace = false;
	let hadUseTranslation = false;

	const useTranslationVisitor = {
		Identifier(path: BabelCore.NodePath<t.Identifier>) {
			// Identifier 是否为useTranslation
			if (path.node.name === "useTranslation") {
				hadUseTranslation = true;
			}
		}
	}

	return {
		name: "closure-id",
		visitor: {
			Program: {
				exit(path: BabelCore.NodePath<t.Program>) {
					if (!import_react_i18next_flag) {
						// 往顶部插入import { useTranslation } from 'react-i18next';
						path.node.body.unshift(t.importDeclaration(
							[
								t.importSpecifier(t.identifier("useTranslation"), t.identifier("useTranslation")),
							],
							t.stringLiteral("react-i18next")
						))
					}
				}
			},
			ImportDeclaration: {
				enter(path: BabelCore.NodePath<t.ImportDeclaration>) {
					const source = path.node.source.value

					if (source === "react-i18next") {
						import_react_i18next_flag = true;
					}
				},
			},
			JSXText: {
				enter: (path: BabelCore.NodePath<t.JSXText>) => {
					// console.log(path.node)
					let text = path.node.value;
					if (!checkSimilarityWithDiceCoefficient(text, searchStr)) return;

					path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)])))
					isReplace = true;

				}
			},
			JSXAttribute: {
				enter: (path: BabelCore.NodePath<t.JSXAttribute>) => {
					if (!path.node.value) return;

					if (path.node.value.type === "StringLiteral") {
						let text = path.node.value.value;
						if (!checkSimilarityWithDiceCoefficient(text, searchStr)) return;

						path.replaceWith(t.jsxAttribute(path.node.name, t.jsxExpressionContainer(t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)]))))
						isReplace = true;

					}
				}
			},
			CallExpression: {
				enter: (path: BabelCore.NodePath<t.CallExpression>) => {
					if (path.node.arguments.length === 0) return;
					let args = path.node.arguments;
					args.forEach((arg: any) => {
						if (arg.type !== "StringLiteral") {
							return;
						}
						let text = arg.value;
						if (!checkSimilarityWithDiceCoefficient(text, searchStr)) return;
						path.replaceWith(t.callExpression(
							path.node.callee,
							[t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)])]
						))
						isReplace = true;

					})
				}
			},
			"VariableDeclarator|FunctionDeclaration": {
				enter: (path: BabelCore.NodePath<t.VariableDeclarator | t.FunctionDeclaration>) => {
					let node = path.node;
					if (!node.id) return;
					if (node.id && node.id.type !== "Identifier") return;
					// 判断path.node.id.name首字母是否大写
					if (node.id.name[0] !== node.id.name[0].toUpperCase()) return;

					// 如果当前是VariableDeclarator且不是箭头函数，直接return
					if (t.isVariableDeclarator(node) && !t.isArrowFunctionExpression(node.init)) return;
					// 下面表名有可能是组件
					path.traverse(useTranslationVisitor);
				},
				exit: (path: BabelCore.NodePath<t.VariableDeclarator | t.FunctionDeclaration>) => {
					let node = path.node;
					if (!node.id) return;
					if (node.id && node.id.type !== "Identifier") return;
					// 判断path.node.id.name首字母是否大写
					if (node.id.name[0] !== node.id.name[0].toUpperCase()) return;

					// 如果当前是VariableDeclarator且不是箭头函数，直接return
					if (t.isVariableDeclarator(node) && !t.isArrowFunctionExpression(node.init)) return;

					let blockStatement = t.isVariableDeclarator(node) && t.isArrowFunctionExpression(node.init) ? node.init.body : t.isFunctionDeclaration(node) ? node.body : null;

					// 下面表名有可能是组件
					if (isReplace && !hadUseTranslation) {
						if (!t.isBlockStatement(blockStatement)) return;
						// 往函数块内部插入const { t } = useTranslation();
						blockStatement.body.unshift(t.variableDeclaration("const", [t.variableDeclarator(t.objectPattern([t.objectProperty(t.identifier("t"), t.identifier("t"), false, true)]), t.callExpression(t.identifier("useTranslation"), []))]))
					}

					isReplace = false;
					hadUseTranslation = false;
				}
			}
		}

	}
}


export default plugin