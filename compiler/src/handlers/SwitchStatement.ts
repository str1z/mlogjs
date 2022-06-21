import { AddressResolver, EJumpKind, JumpInstruction } from "../instructions";
import { es, IInstruction, THandler } from "../types";
import { LiteralValue } from "../values";

export const SwitchStatement: THandler<null> = (
  c,
  scope,
  node: es.SwitchStatement
) => {
  const innerScope = scope.createScope();

  const [ref, refInst] = c.handleConsume(scope, node.discriminant);

  const inst: IInstruction[] = [];

  const endAdress = new LiteralValue(innerScope, null as never);
  const endLine = new AddressResolver(endAdress).bindBreak(innerScope);

  const caseJumps: IInstruction[] = [];
  let defaultJump: IInstruction | undefined;

  for (const scase of node.cases) {
    const [, bodyInst] = c.handleMany(innerScope, scase.consequent);
    const bodyAdress = new LiteralValue(innerScope, null as never);
    const bodyLine = new AddressResolver(bodyAdress);

    if (!scase.test) {
      [defaultJump] = c.handle(innerScope, scase, () => [
        null,
        [new JumpInstruction(bodyAdress, EJumpKind.Always)],
      ])[1];
      inst.push(bodyLine, ...bodyInst);
      continue;
    }

    const [test, testInst] = c.handleConsume(innerScope, scase.test);

    // check if it can be evaluated at compile time
    const [comp] = ref["=="](innerScope, test);

    // if the constant expression resolves to false
    // the whole case gets omitted
    // otherwise it returns the instructions for
    // the body of this case
    if (comp instanceof LiteralValue) {
      if (comp.data) return [null, bodyInst];
      else continue;
    }
    // makes sourcemapping for the jump more specific
    const [, jump] = c.handle(innerScope, scase, () => [
      null,
      [new JumpInstruction(bodyAdress, EJumpKind.StrictEqual, ref, test)],
    ]);

    caseJumps.push(...testInst, ...jump);
    inst.push(bodyLine, ...bodyInst);
  }

  // ensures that the processor exits
  // the switch if no cases match
  defaultJump ??= new JumpInstruction(endAdress, EJumpKind.Always);

  return [
    null,
    [
      ...refInst,
      ...caseJumps,
      ...(caseJumps.length > 0 ? [defaultJump] : []),
      ...inst,
      endLine,
    ],
  ];
};