import { CompilerError } from "../../CompilerError";
import { InstructionBase } from "../../instructions";
import { LiteralValue, StoreValue } from "../../values";
import { MacroFunction } from "../Function";

export class PackColor extends MacroFunction {
  constructor() {
    super((c, out, ...args) => {
      if (args.length !== 4) {
        throw new CompilerError(
          `Expected 4 arguments, received ${args.length}`,
        );
      }

      if (
        !args.every(
          (value): value is StoreValue | LiteralValue =>
            value instanceof StoreValue ||
            (value instanceof LiteralValue && value.isNumber()),
        )
      ) {
        throw new CompilerError(
          "packColor arguments must be either stores or number literals",
        );
      }

      const output = c.getValueOrTemp(out);
      return [new InstructionBase("packcolor", output, ...args)];
    });
  }
}
