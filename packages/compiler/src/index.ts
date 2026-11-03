/**
 * @mbuf/compiler
 * Robust Lexer, Parser, AST, Optimizer, and Code Generator for the .mbuf declarative UI syntax.
 */

// --- 1. LEXER ---
export type TokenType =
  | "KEYWORD"
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  | "EQUALS"
  | "COLON"
  | "LBRACE"
  | "RBRACE"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

const KEYWORDS = new Set(["app", "memory", "element", "text", "class", "style", "onClick", "onInput", "onChange"]);

export class Lexer {
  private pos = 0;
  private line = 1;
  private col = 1;

  constructor(private input: string) {}

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];

      // Whitespace
      if (/\s/.test(ch)) {
        if (ch === "\n") {
          this.line++;
          this.col = 1;
        } else {
          this.col++;
        }
        this.pos++;
        continue;
      }

      // Comments: // ...
      if (ch === "/" && this.input[this.pos + 1] === "/") {
        while (this.pos < this.input.length && this.input[this.pos] !== "\n") {
          this.pos++;
        }
        continue;
      }

      const startCol = this.col;
      const startLine = this.line;

      // Single char punctuation
      if (ch === "{") {
        tokens.push({ type: "LBRACE", value: "{", line: startLine, col: startCol });
        this.advance();
      } else if (ch === "}") {
        tokens.push({ type: "RBRACE", value: "}", line: startLine, col: startCol });
        this.advance();
      } else if (ch === "(") {
        tokens.push({ type: "LPAREN", value: "(", line: startLine, col: startCol });
        this.advance();
      } else if (ch === ")") {
        tokens.push({ type: "RPAREN", value: ")", line: startLine, col: startCol });
        this.advance();
      } else if (ch === "=") {
        tokens.push({ type: "EQUALS", value: "=", line: startLine, col: startCol });
        this.advance();
      } else if (ch === ":") {
        tokens.push({ type: "COLON", value: ":", line: startLine, col: startCol });
        this.advance();
      } else if (ch === ",") {
        tokens.push({ type: "COMMA", value: ",", line: startLine, col: startCol });
        this.advance();
      } else if (ch === '"' || ch === "'") {
        tokens.push(this.readString(ch, startLine, startCol));
      } else if (/[0-9]/.test(ch)) {
        tokens.push(this.readNumber(startLine, startCol));
      } else if (/[a-zA-Z_]/.test(ch)) {
        tokens.push(this.readIdent(startLine, startCol));
      } else {
        throw new Error(`[MBUF Compiler] Unexpected character '${ch}' at line ${startLine}, col ${startCol}`);
      }
    }

    tokens.push({ type: "EOF", value: "", line: this.line, col: this.col });
    return tokens;
  }

  private advance(): void {
    this.pos++;
    this.col++;
  }

  private readString(quote: string, line: number, col: number): Token {
    this.advance(); // skip opening quote
    let str = "";
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === "\n") {
        this.line++;
        this.col = 1;
      }
      str += this.input[this.pos];
      this.advance();
    }
    if (this.pos >= this.input.length) {
      throw new Error(`[MBUF Compiler] Unterminated string starting at line ${line}, col ${col}`);
    }
    this.advance(); // skip closing quote
    return { type: "STRING", value: str, line, col };
  }

  private readNumber(line: number, col: number): Token {
    let numStr = "";
    while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
      numStr += this.input[this.pos];
      this.advance();
    }
    return { type: "NUMBER", value: numStr, line, col };
  }

  private readIdent(line: number, col: number): Token {
    let ident = "";
    while (this.pos < this.input.length && /[a-zA-Z0-9_-]/.test(this.input[this.pos])) {
      ident += this.input[this.pos];
      this.advance();
    }
    const type: TokenType = KEYWORDS.has(ident) ? "KEYWORD" : "IDENTIFIER";
    return { type, value: ident, line, col };
  }
}

// --- 2. AST DEFINITIONS ---
export interface ASTMemoryDecl {
  type: "MemoryDecl";
  name: string;
  initialValue: string | number;
}

export interface ASTElement {
  type: "Element";
  tag: string;
  text?: string;
  isDynamicText?: boolean;
  className?: string;
  style?: string;
  props: Record<string, string>;
  eventHandlers: Record<string, string>;
  children: ASTElement[];
  isStatic?: boolean;
}

export interface ASTApp {
  type: "App";
  name: string;
  state: ASTMemoryDecl[];
  elements: ASTElement[];
}

// --- 3. PARSER ---
export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: "EOF", value: "", line: 0, col: 0 };
  }

  private consume(expectedType?: TokenType, expectedValue?: string): Token {
    const token = this.peek();
    if (expectedType && token.type !== expectedType) {
      throw new Error(`[MBUF Parser] Expected token type ${expectedType} but found ${token.type} at line ${token.line}, col ${token.col}`);
    }
    if (expectedValue && token.value !== expectedValue) {
      throw new Error(`[MBUF Parser] Expected '${expectedValue}' but found '${token.value}' at line ${token.line}, col ${token.col}`);
    }
    this.current++;
    return token;
  }

  public parse(): ASTApp {
    this.consume("KEYWORD", "app");
    const appName = this.consume("IDENTIFIER").value;
    this.consume("LBRACE");

    const state: ASTMemoryDecl[] = [];
    const elements: ASTElement[] = [];

    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const tok = this.peek();
      if (tok.type === "KEYWORD" && tok.value === "memory") {
        state.push(this.parseMemoryDecl());
      } else if (tok.type === "KEYWORD" && tok.value === "element") {
        elements.push(this.parseElement());
      } else {
        throw new Error(`[MBUF Parser] Unexpected token '${tok.value}' at line ${tok.line}`);
      }
    }

    this.consume("RBRACE");
    return { type: "App", name: appName, state, elements };
  }

  private parseMemoryDecl(): ASTMemoryDecl {
    this.consume("KEYWORD", "memory");
    const name = this.consume("IDENTIFIER").value;
    this.consume("EQUALS");

    const valToken = this.peek();
    let initialValue: string | number;

    if (valToken.type === "NUMBER") {
      initialValue = Number(this.consume("NUMBER").value);
    } else if (valToken.type === "STRING") {
      initialValue = this.consume("STRING").value;
    } else {
      throw new Error(`[MBUF Parser] Unsupported memory initial value at line ${valToken.line}`);
    }

    return { type: "MemoryDecl", name, initialValue };
  }

  private parseElement(): ASTElement {
    this.consume("KEYWORD", "element");
    const tag = this.consume("IDENTIFIER").value;
    this.consume("LBRACE");

    const elementNode: ASTElement = {
      type: "Element",
      tag,
      props: {},
      eventHandlers: {},
      children: []
    };

    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      const tok = this.peek();

      if (tok.value === "text") {
        this.consume();
        this.consume("COLON");
        const textVal = this.consume("STRING").value;
        elementNode.text = textVal;
        elementNode.isDynamicText = /\{([^}]+)\}/.test(textVal);
      } else if (tok.value === "class") {
        this.consume();
        this.consume("COLON");
        elementNode.className = this.consume("STRING").value;
      } else if (tok.value === "style") {
        this.consume();
        this.consume("COLON");
        elementNode.style = this.consume("STRING").value;
      } else if (tok.value.startsWith("on")) {
        const eventName = this.consume().value;
        this.consume("LBRACE");
        let body = "";
        while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
          body += this.consume().value + " ";
        }
        this.consume("RBRACE");
        elementNode.eventHandlers[eventName] = body.trim();
      } else if (tok.value === "element") {
        elementNode.children.push(this.parseElement());
      } else {
        // Generic attribute binding: propName: "value"
        const propName = this.consume().value;
        if (this.peek().type === "COLON") {
          this.consume("COLON");
          elementNode.props[propName] = this.consume("STRING").value;
        }
      }
    }

    this.consume("RBRACE");
    return elementNode;
  }
}

// --- 4. STATIC OPTIMIZER PASS ---
export function optimizeAST(ast: ASTApp): ASTApp {
  function optimizeElement(el: ASTElement): ASTElement {
    const hasDynamicText = el.isDynamicText;
    const hasHandlers = Object.keys(el.eventHandlers).length > 0;
    const optimizedChildren = el.children.map(optimizeElement);
    const hasDynamicChildren = optimizedChildren.some((c) => !c.isStatic);

    el.children = optimizedChildren;
    el.isStatic = !hasDynamicText && !hasHandlers && !hasDynamicChildren;
    return el;
  }

  ast.elements = ast.elements.map(optimizeElement);
  return ast;
}

// --- 5. CODE GENERATOR ---
export class CodeGenerator {
  public generate(ast: ASTApp): string {
    const lines: string[] = [];
    lines.push(`// Generated by MBUF Compiler (Optimized)`);
    lines.push(`import { memory, ui, createComponent } from "mbuf";`);
    lines.push(``);
    lines.push(`export const ${ast.name} = createComponent(() => {`);

    // Memory cells
    for (const mem of ast.state) {
      const valLiteral = typeof mem.initialValue === "string" ? `"${mem.initialValue}"` : mem.initialValue;
      lines.push(`  const ${mem.name} = memory.cell(${valLiteral});`);
    }

    lines.push(`  return ui.element("div", { class: "mbuf-app-${ast.name.toLowerCase()}" },`);

    const elCode = ast.elements.map((el) => this.genElement(el, ast.state)).join(",\n");
    lines.push(elCode);

    lines.push(`  );`);
    lines.push(`});`);

    return lines.join("\n");
  }

  private genElement(el: ASTElement, state: ASTMemoryDecl[]): string {
    const props: string[] = [];

    if (el.className) {
      props.push(`class: "${el.className}"`);
    }
    if (el.style) {
      props.push(`style: "${el.style}"`);
    }
    for (const [k, v] of Object.entries(el.props)) {
      props.push(`${k}: "${v}"`);
    }

    // Handlers
    for (const [evt, action] of Object.entries(el.eventHandlers)) {
      const translated = this.translateAction(action, state);
      props.push(`${evt}: () => { ${translated} }`);
    }

    const propsObj = props.length > 0 ? `{ ${props.join(", ")} }` : "null";
    const children: string[] = [];

    // Text content
    if (el.text !== undefined) {
      if (el.isDynamicText) {
        const interpolated = el.text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => `\${${name}.get()}`);
        children.push(`ui.text(() => \`${interpolated}\`)`);
      } else {
        children.push(`ui.text("${el.text}")`);
      }
    }

    // Children elements
    for (const child of el.children) {
      children.push(this.genElement(child, state));
    }

    const childArgs = children.length > 0 ? `, ${children.join(", ")}` : "";
    return `    ui.element("${el.tag}", ${propsObj}${childArgs})`;
  }

  private translateAction(action: string, state: ASTMemoryDecl[]): string {
    let code = action;
    for (const mem of state) {
      const name = mem.name;
      const assignRegex = new RegExp(`\\b${name}\\s*=\\s*(.+)`, "g");
      code = code.replace(assignRegex, (_, rhs) => {
        const cleanRhs = rhs.replace(new RegExp(`\\b${name}\\b`, "g"), `${name}.get()`);
        return `${name}.set(${cleanRhs});`;
      });
    }
    return code;
  }
}

/**
 * Compiles a .mbuf source string into standard JavaScript code with static optimization.
 */
export function compile(source: string): { ast: ASTApp; code: string } {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  let ast = parser.parse();
  ast = optimizeAST(ast);
  const generator = new CodeGenerator();
  const code = generator.generate(ast);
  return { ast, code };
}
