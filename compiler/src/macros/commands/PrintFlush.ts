import { InstructionBase } from "../../instructions";
import { MacroFunction } from "..";
import { IScope, IValue } from "../../types";
import { SenseableValue } from "../../values";
import { CompilerError } from "../../CompilerError";

export class PrintFlush extends MacroFunction<null> {
  constructor(scope: IScope) {
    super(scope, (target: IValue) => {
      if (!(target instanceof SenseableValue))
        throw new CompilerError(
          "The printflush target must be a senseable value"
        );
      return [null, [new InstructionBase("printflush", target)]];
    });
  }
}
