import { PathLike, readFileSync } from 'fs';

const KeyWords = [
    "TS_SIGNATURE"
];

type NodeType = 'Program' | 'StringLiteral' | 'CallExpression' | 'Comment';

interface BaseNode {
    type: NodeType
}

class Token {

    constructor(public type: "keywords" | "paren" | "string" | "comment" | "other", public value: string = "") {

    }

    append(value: string) {
        this.value += value;
    }
}

class AST implements BaseNode {
    type: NodeType = "Program";

    body: Array<CallExpressionNode | CommentNode> = [];

    constructor() {
    }
}

class ParamNode implements BaseNode {
    constructor(public type: "StringLiteral", public value: string) {

    }
}

class CommentNode implements BaseNode {
    type: NodeType = "Comment";
    constructor(public value: string) {

    }
}

class CallExpressionNode implements BaseNode {
    type: NodeType = "CallExpression";

    constructor(public name: string, public params: ParamNode[] = []) {
    }

    AddParam(node: ParamNode) {
        this.params.push(node);
    }
}

export class Compiler {

    parser(tokens: Token[]) {
        let current = 0;
        function walk(): Array<CallExpressionNode | CommentNode> | undefined {
            let token = tokens[current];
            if (!token) {
                return;
            }
            if (
                token.type === 'keywords' &&
                tokens[current + 1].type === "paren" &&
                tokens[current + 1].value === "("
            ) {
                let comment: CommentNode | undefined = undefined;
                if (current > 1 && tokens[current - 1].type === "comment") {
                    comment = new CommentNode(tokens[current - 1].value);
                }
                let node = new CallExpressionNode(token.value);
                current += 2;
                token = tokens[current];
                while (
                    (token.type !== 'paren') ||
                    (token.type === 'paren' && token.value !== ')')
                ) {
                    if (token.type != "string") {
                        throw TypeError("Marco Params Only Allow String");
                    }
                    node.AddParam(new ParamNode("StringLiteral", token.value))
                    token = tokens[++current];
                }
                current++;
                if (comment) {
                    return [comment, node];
                } else {
                    return [node];
                }
            }
            current++;
        }
        let ast: AST = {
            type: 'Program',
            body: [],
        };
        while (current < tokens.length) {
            const nodes = walk();
            if (nodes && nodes.length > 0) {
                ast.body.push(...nodes);
            }
        }
        return ast;
    }

    tokenizer(input: string) {
        const tokens: Token[] = [];
        let current = 0;
        let state: "unmatched" | "matched" = "unmatched";
        let other_content = "";
        while (current < input.length) {
            if (input[current] === '"' && state === "matched") {
                const token = new Token("string");
                let char = input[++current];
                while (char !== '"') {
                    if (char == "\\") {
                        token.append(char);
                        current++;
                        char = input[current];
                        token.append(char);
                        current++;
                    } else {
                        token.append(char);
                        current++;
                    }
                    char = input[current];
                }
                tokens.push(token);
                current++;
                continue;
            }
            if (input.slice(current, current + 3) === "/**") {
                if (other_content.length > 0) {
                    tokens.push(new Token("other", other_content));
                    other_content = "";
                }
                const token = new Token("comment");
                let char = input[current];
                do {
                    token.append(char);
                    current++;
                    char = input[current];
                } while (input.slice(current, current + 3) != "*/\n")
                token.append("*/\n");
                tokens.push(token);
                current += 3;
                continue;
            }
            if ((input[current] === "(" || input[current] === ")") && state === "matched") {
                tokens.push(new Token("paren", input[current]));
                if (input[current] === ")") {
                    state = "unmatched";
                }
                current++;
                continue;
            }
            if (
                input.slice(current, current + 3) === "TS_" &&
                state === "unmatched"
            ) {
                const matched = KeyWords.find(keyword =>
                    input.slice(current, current + keyword.length) === keyword
                )
                if (matched) {
                    if (other_content.length > 0) {
                        tokens.push(new Token("other", other_content));
                        other_content = "";
                    }
                    state = "matched";
                    const token = new Token("keywords", matched);
                    tokens.push(token);
                    current += matched.length;
                    continue;
                }
            }
            other_content += /\s/.test(input[current]) ? "" : input[current];
            current++;
        }
        return tokens;
    }

    codeGenerator(node: BaseNode): string {
        switch (node.type) {
            case 'Program':
                {
                    return (node as AST).body.reduce((pre, curr) => {
                        const text = this.codeGenerator(curr);
                        pre += curr.type === "Comment" ? text : text + "\n";
                        return pre;
                    }, "")
                }
            case 'Comment':
                {
                    return (node as CommentNode).value;
                }
            case 'CallExpression':
                return (node as CallExpressionNode).params.map((param) => this.codeGenerator(param)).join("") + "\n";
            case 'StringLiteral':
                {
                    return (node as ParamNode).value;
                }
            default:
                throw new TypeError(node.type);
        }
    }

    compile(content: string) {
        const tokens = this.tokenizer(content);
        const ast = this.parser(tokens);
        const code = this.codeGenerator(ast);
        return code;
    }
}