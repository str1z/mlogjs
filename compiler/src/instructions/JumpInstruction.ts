import { IValue, TLineRef } from "../types";
import { InstructionBase } from "./InstructionBase";

export enum EJumpKind {
  Equal = "equal",
  NotEqual = "notEqual",
  LessThan = "lessThan",
  LessThanEq = "lessThanEq",
  GreaterThan = "greaterThan",
  GreaterThanEq = "greaterThanEq",
  StrictEqual = "strictEqual",
  Always = "always",
}

export class JumpInstruction extends InstructionBase {
  constructor(
    public address: TLineRef,
    kind: EJumpKind,
    left: IValue | null = null,
    right: IValue | null = null,
  ) {
    super("jump", address, kind, left, right);
  }
}
