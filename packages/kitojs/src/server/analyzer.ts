import * as acorn from "acorn";
import * as walk from "acorn-walk";

export type StaticResponseType =
  | { type: "none" }
  | {
      type: "full_static";
      method: string;
      status: number;
      headers: Record<string, string>;
      body: string;
    }
  | {
      type: "param_template";
      method: string;
      status: number;
      headers: Record<string, string>;
      template: string;
      params: string[];
    };

interface ResponseCall {
  method: "send" | "json" | "text" | "html";
  arg?: any;
  usesContext: boolean;
}

export function analyzeHandler(handler: Function): StaticResponseType {
  const source = handler.toString();

  try {
    const ast = acorn.parse(source, {
      ecmaVersion: 2022,
      sourceType: "module",
    }) as any;

    let responseCall: ResponseCall | null = null;
    let hasLogic = false;

    const usedParams = new Set<string>();
    const usedQuery = new Set<string>();

    walk.simple(ast, {
      CallExpression(node: any) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "MemberExpression" &&
          node.callee.object.property.name === "res"
        ) {
          const method = node.callee.property.name;

          if (["send", "json", "text", "html"].includes(method)) {
            if (responseCall !== null) {
              hasLogic = true;
              return;
            }

            const newResponseCall: ResponseCall = {
              method,
              arg: node.arguments[0],
              usesContext: false,
            };

            walk.simple(node.arguments[0], {
              MemberExpression(argNode: any) {
                if (
                  argNode.object.type === "Identifier" &&
                  argNode.object.name === "ctx"
                ) {
                  newResponseCall.usesContext = true;
                }
              },
            });

            responseCall = newResponseCall;
          }
        }
      },

      MemberExpression(node: any) {
        if (
          node.object.type === "MemberExpression" &&
          node.object.object.type === "MemberExpression" &&
          node.object.object.property.name === "req" &&
          node.object.property.name === "params"
        ) {
          if (node.property.type === "Identifier") {
            usedParams.add(node.property.name);
          }
        }

        if (
          node.object.type === "MemberExpression" &&
          node.object.object.type === "MemberExpression" &&
          node.object.object.property.name === "req" &&
          node.object.property.name === "query"
        ) {
          if (node.property.type === "Identifier") {
            usedQuery.add(node.property.name);
          }
        }
      },

      VariableDeclaration() {
        hasLogic = true;
      },

      IfStatement() {
        hasLogic = true;
      },
      ForStatement() {
        hasLogic = true;
      },
      WhileStatement() {
        hasLogic = true;
      },
    });

    if (!responseCall) {
      return { type: "none" };
    }

    const rc = responseCall as ResponseCall;

    if (hasLogic) {
      return { type: "none" };
    }

    if (!rc.usesContext) {
      const value = evaluateStaticValue(rc.arg, source);
      if (value === null) {
        return { type: "none" };
      }

      const { body, contentType } = serializeResponseValue(rc.method, value);

      return {
        type: "full_static",
        method: rc.method,
        status: 200,
        headers: {
          "content-type": contentType,
          "content-length": body.length.toString(),
        },
        body: body.toString("base64"),
      };
    }

    if (usedParams.size > 0 || usedQuery.size > 0) {
      if (rc.method === "json" && rc.arg?.type === "ObjectExpression") {
        const template = extractTemplate(rc.arg);
        return {
          type: "param_template",
          method: "json",
          status: 200,
          headers: {
            "content-type": "application/json",
          },
          template,
          params: Array.from(usedParams),
        };
      }
    }

    return { type: "none" };
  } catch (error) {
    console.warn("Failed to analyze handler:", error);
    return { type: "none" };
  }
}

function evaluateStaticValue(node: any, source: string): any {
  if (!node) return null;

  try {
    switch (node.type) {
      case "Literal":
        return node.value;

      case "ObjectExpression":
        const obj: any = {};
        for (const prop of node.properties) {
          if (prop.type === "Property" && prop.key.type === "Identifier") {
            const value = evaluateStaticValue(prop.value, source);
            if (value === null) return null;
            obj[prop.key.name] = value;
          }
        }
        return obj;

      case "ArrayExpression":
        const arr: any[] = [];
        for (const element of node.elements) {
          const value = evaluateStaticValue(element, source);
          if (value === null) return null;
          arr.push(value);
        }
        return arr;

      case "TemplateLiteral":
        if (node.expressions.length === 0) {
          return node.quasis[0].value.cooked;
        }
        return null;

      default:
        return null;
    }
  } catch {
    return null;
  }
}

function serializeResponseValue(
  method: string,
  value: any,
): { body: Buffer; contentType: string } {
  switch (method) {
    case "json":
      return {
        body: Buffer.from(JSON.stringify(value), "utf-8"),
        contentType: "application/json",
      };
    case "text":
    case "send":
      return {
        body: Buffer.from(String(value), "utf-8"),
        contentType: "text/plain",
      };
    case "html":
      return {
        body: Buffer.from(String(value), "utf-8"),
        contentType: "text/html",
      };
    default:
      return {
        body: Buffer.from(String(value), "utf-8"),
        contentType: "text/plain",
      };
  }
}

function extractTemplate(node: any): string {
  const parts: string[] = [];

  function processNode(n: any): string {
    if (n.type === "Literal") return JSON.stringify(n.value);
    if (
      n.type === "MemberExpression" &&
      n.object.type === "MemberExpression" &&
      n.object.object.type === "MemberExpression" &&
      n.object.object.property.name === "req"
    ) {
      const source = n.object.property.name;
      const key = n.property.name;
      return `"{{${source}.${key}}}"`;
    }
    return "null";
  }

  const props = node.properties.map((prop: any) => {
    const key = prop.key.name;
    const value = processNode(prop.value);
    return `"${key}":${value}`;
  });

  return `{${props.join(",")}}`;
}
