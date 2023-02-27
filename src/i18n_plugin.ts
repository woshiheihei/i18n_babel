import * as t from "@babel/types"
import BabelCore from '@babel/core'
import natural from "natural"

function checkSimilarityWithDiceCoefficient(str1: string, str2: string, threshold = 0.6) {
	const dice = natural.DiceCoefficient(str1, str2);
	return dice > threshold;
}


const plugin = (searchStr: string, replaceStr: string, similarityBaseThreshold: number = 0.6) => {
	console.log("******************************************************************************************");
	console.log('replaceStr: ', replaceStr);
	console.log('searchStr: ', searchStr);

	let import_react_i18next_flag = false;
	let neededImport = false;
	let cache: Record<string, {
		isReplace: boolean,
		hadUseTranslation: boolean
	}> = {}

	const useTranslationVisitor = {
		Identifier(path: BabelCore.NodePath<t.Identifier>) {
			if (path.node.name === "useTranslation") {
				console.log('检测到useTranslation: ');
				// @ts-ignore
				this.cacheNode.hadUseTranslation = true;
				path.stop();
			}
		}
	}

	let replaceVisitor = {
		ObjectProperty(path: BabelCore.NodePath<t.ObjectProperty>) {
			if (path.node.key.type !== "Identifier") return;
			if (path.node.value.type !== "StringLiteral") return;
			let text = path.node.value.value;
			if (!checkSimilarityWithDiceCoefficient(text, searchStr, similarityBaseThreshold)) return;
			path.replaceWith(t.objectProperty(path.node.key, t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)])))
			neededImport = true;
			// @ts-ignore

			this.cacheNode.isReplace = true;

		},
		JSXText(path: BabelCore.NodePath<t.JSXText>) {
			let text = path.node.value;
			if (!checkSimilarityWithDiceCoefficient(text, searchStr, similarityBaseThreshold)) return;

			path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)])))
			neededImport = true;


			// @ts-ignore
			this.cacheNode.isReplace = true;

		},
		JSXExpressionContainer
			(path: BabelCore.NodePath<t.JSXExpressionContainer>) {
			if (path.node.expression.type === "StringLiteral") {
				let text = path.node.expression.value;
				if (!checkSimilarityWithDiceCoefficient(text, searchStr, similarityBaseThreshold)) return;
				path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)])))
				neededImport = true;


				// @ts-ignore
				this.cacheNode.isReplace = true;

			}
		},
		JSXAttribute(path: BabelCore.NodePath<t.JSXAttribute>) {
			// @ts-ignore
			if (!path.node.value) return;

			if (path.node.value.type === "StringLiteral") {
				let text = path.node.value.value;
				if (!checkSimilarityWithDiceCoefficient(text, searchStr, similarityBaseThreshold)) return;

				path.replaceWith(t.jsxAttribute(path.node.name, t.jsxExpressionContainer(t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)]))))
				neededImport = true;


				// @ts-ignore
				this.cacheNode.isReplace = true;
				console.log("JSXAttributecache", cache);
				// @ts-ignore
				console.log('JSXAttributethis.cacheNode: ', this.cacheNode);

			}
		},
		CallExpression(path: BabelCore.NodePath<t.CallExpression>) {
			if (path.node.arguments.length === 0) return;
			let args = path.node.arguments;
			args.forEach((arg: any) => {
				if (arg.type !== "StringLiteral") {
					return;
				}
				let text = arg.value;
				if (!checkSimilarityWithDiceCoefficient(text, searchStr, similarityBaseThreshold)) return;
				path.replaceWith(t.callExpression(
					path.node.callee,
					[t.callExpression(t.identifier("t"), [t.stringLiteral(replaceStr)])]
				))
				neededImport = true;
				// @ts-ignore
				this.cacheNode.isReplace = true;

			})
		}

	};

	return {
		name: "closure-id",
		visitor: {
			Program: {
				exit(path: BabelCore.NodePath<t.Program>) {

					if (!import_react_i18next_flag && neededImport) {
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

			"VariableDeclarator|FunctionDeclaration|FunctionExpression": {
				enter: (path: BabelCore.NodePath<t.VariableDeclarator | t.FunctionDeclaration | t.FunctionExpression>) => {
					let node = path.node;
					if (!node.id) return;
					if (node.id && node.id.type !== "Identifier") return;
					// 判断path.node.id.name首字母是否大写或者是否以use开头
					if (node.id.name[0] !== node.id.name[0].toUpperCase() && node.id.name.slice(0, 3) !== "use") return;


					if (!cache[node.id.name]) cache[node.id.name] = {
						hadUseTranslation: false,
						isReplace: false
					};
					let cacheNode = cache[node.id.name];

					// 下面表名有可能是组件
					path.traverse(useTranslationVisitor, { cacheNode });
					path.traverse(replaceVisitor, { cacheNode })

				},
				exit: (path: BabelCore.NodePath<t.VariableDeclarator | t.FunctionDeclaration | t.FunctionExpression>) => {
					let node = path.node;
					if (!node.id) return;
					if (node.id && node.id.type !== "Identifier") return;
					// 判断path.node.id.name首字母是否大写或者是否以use开头
					if (node.id.name[0] !== node.id.name[0].toUpperCase() && node.id.name.slice(0, 3) !== "use") return;

					let blockStatement = t.isVariableDeclarator(node) && t.isArrowFunctionExpression(node.init) ? node.init.body : t.isFunctionDeclaration(node) || t.isFunctionExpression(node) ? node.body : null;

					let cacheNode = cache[node.id.name];
					console.log('exit: ', node.id.name);
					console.log('cache: ', cache);
					console.log('cacheNode: ', cacheNode);

					// 下面表名有可能是组件
					if (cacheNode.isReplace && !cacheNode.hadUseTranslation) {
						console.log('函数块: ', node.id.name);
						if (!t.isBlockStatement(blockStatement)) return;
						// 往函数块内部插入const { t } = useTranslation();
						blockStatement.body.unshift(t.variableDeclaration("const", [t.variableDeclarator(t.objectPattern([t.objectProperty(t.identifier("t"), t.identifier("t"), false, true)]), t.callExpression(t.identifier("useTranslation"), []))]))
						// cacheNode.isReplace = false;
						// cacheNode.hadUseTranslation = false;
					}


				}
			}
		}

	}
}


export default plugin