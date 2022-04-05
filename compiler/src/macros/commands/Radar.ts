import { InstructionBase } from "../../instructions";
import { MacroFunction } from "..";
import { IScope } from "../../types";
import { LiteralValue, ObjectValue, StoreValue } from "../../values";
import { Unit } from "../Namespace";
import { CompilerError } from "../../CompilerError";

export const validRadarFilters = [
  "any",
  "enemy",
  "ally",
  "player",
  "attacker",
  "flying",
  "boss",
  "ground",
];

export const validRadarSorts = [
  "distance",
  "health",
  "shield",
  "armor",
  "maxHealth",
];

export class Radar extends MacroFunction {
  constructor(scope: IScope) {
    super(scope, (building, filter1, filter2, filter3, order, sort) => {
      if (!(building instanceof ObjectValue))
        throw new CompilerError("The building must a store");

      if (
        !(filter1 instanceof LiteralValue) ||
        typeof filter1.data !== "string" ||
        !(filter2 instanceof LiteralValue) ||
        typeof filter2.data !== "string" ||
        !(filter3 instanceof LiteralValue) ||
        typeof filter3.data !== "string"
      )
        throw new CompilerError("The filters must be string literals");

      if (!validRadarFilters.includes(filter1.data))
        throw new CompilerError("Invalid value for filter1");
      if (!validRadarFilters.includes(filter2.data))
        throw new CompilerError("Invalid value for filter2");
      if (!validRadarFilters.includes(filter3.data))
        throw new CompilerError("Invalid value for filter3");

      if (!(order instanceof LiteralValue || order instanceof StoreValue))
        throw new CompilerError("The radar order must be a literal or a store");

      if (!(sort instanceof LiteralValue) || typeof sort.data !== "string")
        throw new CompilerError("The radar sort must be a string literal");

      if (!validRadarSorts.includes(sort.data))
        throw new CompilerError("Invalid sort value");
      const outUnit = new Unit(scope);
      return [
        outUnit,
        [
          new InstructionBase(
            "radar",
            filter1.data,
            filter2.data,
            filter3.data,
            sort.data,
            building,
            order,
            outUnit
          ),
        ],
      ];
    });
  }
}
