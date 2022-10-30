import { Compiler } from "../Compiler";
import { THandler, es, IScope, TValueInstructions, TEOutput } from "../types";
import { nodeName } from "../utils";
import { FunctionValue } from "../values/FunctionValue";
import { ValueOwner } from "../values/ValueOwner";

function handleFunctionNode(
  c: Compiler,
  scope: IScope,
  node: es.Function,
  out?: TEOutput
): TValueInstructions<FunctionValue> {
  let { params, body } = node;

  if (es.isExpression(body)) {
    const { loc } = body;
    const statement = es.returnStatement(body);
    statement.loc = loc;
    body = es.blockStatement([statement]);
    body.loc = loc;
  }

  return [
    new FunctionValue({
      scope,
      params: params as es.Identifier[],
      body,
      c,
      out,
    }),
    [],
  ];
}

export const ArrowFunctionExpression: THandler = (
  c,
  scope,
  node: es.ArrowFunctionExpression,
  out
) => {
  return handleFunctionNode(c, scope, node, out);
};

export const FunctionDeclaration: THandler = (
  c,
  scope,
  node: es.FunctionDeclaration,
  out
) => {
  const identifier = (node.id as es.Identifier).name;
  const name = nodeName(node, !c.compactNames && identifier);
  const functionIns = handleFunctionNode(c, scope, node, out);
  const owner = new ValueOwner({
    scope,
    value: functionIns[0],
    identifier,
    name,
  });
  return [scope.set(owner), []];
};

export const FunctionExpression: THandler = ArrowFunctionExpression;
export const ObjectMethod: THandler = ArrowFunctionExpression;
