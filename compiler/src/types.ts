export * as es from "@babel/types";
import * as es from "@babel/types";
import { Compiler } from "./Compiler";
import { AddressResolver } from "./instructions";
import { MacroFunction } from "./macros";
import { LeftRightOperator, UnaryOperator, UpdateOperator } from "./operators";

export enum EInstIntent {
  none,
  break,
  continue,
  return,
}

export interface IInstruction {
  intent: EInstIntent;
  hidden: boolean;
  resolve(i: number): void;
  source?: es.SourceLocation;
  /**
   * Helps analyzing control flow, handlers should
   * indicate which instructions returned are guaranteed to run
   */
  alwaysRuns: boolean;
}

/**
 * The expression output, either a value or a value name.
 *
 * Knowing the output variable can be beneficial for static optimizations.
 *
 * A string means that the handler should create a value with the given name.
 *
 * An IValue means that the handler should try to use `this` as the output value.
 */
export type TEOutput = IValue | string;

export type THandler<T extends IValue | null = IValue> = (
  compiler: Compiler,
  scope: IScope,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any,
  out: TEOutput | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arg: any
) => TValueInstructions<T>;

/**
 * The scope manages the source code generated variables and their owners,
 * as well as break and continue statements and they also work as function
 * bodies.
 */
export interface IScope {
  /** Every scope except the top level one has a parent */
  parent: IScope | null;
  /** The registry of variables contained by this scope */
  data: Record<string, IValueOwner | null>;
  name: string;
  /**
   * Additional instructions required by this scope, such as
   * the instructions that make the body of a function
   */
  inst: IInstruction[];
  /** The label applied to this scope */
  label?: string;
  /** Where to jump to on a break statement */
  break: AddressResolver;
  /** Where to jump to on a continue statement */
  continue: AddressResolver;
  /** The function linked to `this`, is `null` when the scope is not inside a function. */
  function: IFunctionValue;
  /** Counts the number of temp variables generated during compilaton */
  ntemp: number;
  /**
   * Creates a new scope that has `this` as it's parent.
   */
  createScope(): IScope;
  /**
   * Creates a new scope to be used by a function value, the scope has the following properties:
   * - uses `name` as it's primary name, it changes how variable names are formatted.
   * - it has `this` as it's parent
   * - independent variable registry
   * @param name The name of the scope
   * @param stacked
   */
  createFunction(name: string, stacked?: boolean): IScope;
  /** Checks if there is an owner registered with the specified identifier */
  has(identifier: string): boolean;
  /** Gets a value by their owner's identifier */
  get(identifier: string): IOwnedValue;
  /**
   * Registers `value` with an owner that uses `name` as both it's name and identifier,
   * throws an error if there already is an owner with the same identitifer.
   * @param name
   * @param value
   */
  set<T extends IValue>(name: string, value: T): T;
  /**
   * Registers `owner` and it's inner value, throws an error
   * if there already is an owner with the same identifier.
   */
  set<T extends IValue>(owner: IValueOwner<T>): T;
  /**
   * Registers `value` with an owner that uses `name` as both it's name and identifier,
   * overriding any preexisting variables with the same identifier.
   * @param name
   * @param value
   */
  hardSet<T extends IValue>(name: string, value: T): T;
  /**
   * Registers `owner` and it's inner value, overriding
   * any preexisting variables with the same identifier.
   * @param owner
   */
  hardSet<T extends IValue>(owner: IValueOwner<T>): T;
  /**
   * Creates an owned store and registers it to this scope.
   * @param identifier The name of the variable that will hold the store
   * @param name The mlog name that the owner will have
   */
  make(identifier: string, name: string): IValue;
  /**
   * Creates a shallow copy of this scope.
   *
   * Be aware that since the copy is shallow, changes on object fields (except `data`)
   * reflect on the original scope. Note that changes to the children of data also follow this rule.
   */
  copy(): IScope;
  /** Creates a temporary mlog variable name */
  makeTempName(): string;
}

/**
 * Owners track how variables will behave when it comes to their usage.
 *
 * As an example, Stores use their owners to determine what to do during
 * assignments, like making a compile time alias, moving the values or generating
 * a `set` instruction.
 */
export interface IValueOwner<T extends IValue = IValue> {
  scope: IScope;
  constant: boolean;
  value: T;
  /** The name of the variable on the source code that generated this value owner */
  identifier?: string;
  /** The name this owner has in it's mlog representation */
  name: string;
  /** Whether this owner is temporary or persistent */
  persistent: boolean;
  /** Set of values owned by this, can be used to get the owned value count  */
  owned: Set<T>;
  /** Adds `target` to the {@link owned set of owned values} and sets its owner to `this` */
  own(target: T): void;
  /** Replaces the currently held value by `target` */
  replace(target: T): void;
  /** Moves all values owned by `this` into `owner` */
  moveInto(owner: IValueOwner<T>): void;
}
// we can't use type maps to define actual methods
// and if we don't do this we'll get an error [ts(2425)]
export interface IValueOperators {
  // unary operators
  "!"(scope: IScope, out?: TEOutput): TValueInstructions;
  "u+"(scope: IScope, out?: TEOutput): TValueInstructions;
  "u-"(scope: IScope, out?: TEOutput): TValueInstructions;
  "delete"(scope: IScope, out?: TEOutput): TValueInstructions;
  "typeof"(scope: IScope, out?: TEOutput): TValueInstructions;
  "void"(scope: IScope, out?: TEOutput): TValueInstructions;
  "~"(scope: IScope, out?: TEOutput): TValueInstructions;

  // update operators
  "++"(scope: IScope, prefix: boolean, out?: TEOutput): TValueInstructions;
  "--"(scope: IScope, prefix: boolean, out?: TEOutput): TValueInstructions;

  // left right operators
  "*"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "**"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "+"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "-"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "/"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "%"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "!="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "!=="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "<"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "<="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "=="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "==="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  ">"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  ">="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "&"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "<<"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  ">>"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  ">>>"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "^"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "|"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  instanceof(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  in(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "&&"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "??"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "||"(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "%="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "&="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "*="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "**="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "+="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "-="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "/="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "&&="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "||="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "??="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "<<="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  ">>="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  ">>>="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "^="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "|="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
  "="(scope: IScope, value: IValue, out?: TEOutput): TValueInstructions;
}

/** Defines the possible types of mutability of a value */
export enum EMutability {
  /**
   * The value can be changed by the user's code,
   * by the mlog runtime, or us
   */
  mutable,
  /**
   * The value cannot be directly assigned,
   * but it's still not safe from mutations coming from the runtime.
   */
  readonly,
  /** Constant values, won't change during execution */
  constant,
  /** An immutable value that hasn't been initialized yet */
  init,
}

export interface IValue extends IValueOperators {
  // main properties
  owner: IValueOwner | null;
  mutability: EMutability;
  macro: boolean;
  /**
   * Evaluates `this`, returning it's representation in a more basic
   * value like `StoreValue` with the instructions required to compute that value
   */
  eval(scope: IScope, out?: TEOutput): TValueInstructions;
  /**
   * Does the same thing as {@link IValue.eval eval}, but ensures that the resulting value has an owner.
   *
   * This behaviour is required when dealing with temporary values inside expressions like comparations.
   */
  consume(scope: IScope): TValueInstructions;
  call(
    scope: IScope,
    args: IValue[],
    out?: TEOutput
  ): TValueInstructions<IValue | null>;
  get(scope: IScope, name: IValue, out?: TEOutput): TValueInstructions;
  ensureOwned(): asserts this is IOwnedValue;
}
/** Helper type that is used in some typescript assertions */
export interface IOwnedValue extends IValue {
  owner: Exclude<IValue["owner"], null>;
}

export type TLiteral = string | number;
export interface IBindableValue extends IValue {
  data: TLiteral;
}

export interface IFunctionValue extends IValue {
  return(
    scope: IScope,
    argument: IValue | null,
    out?: TEOutput
  ): TValueInstructions<IValue | null>;
}

/** Contains a value and the instructions required to compute it */
export type TValueInstructions<Content extends IValue | null = IValue> = [
  Content,
  IInstruction[]
];

/** Map of overridable operators in object macros */
export type TOperatorMacroMap = {
  [K in
    | UnaryOperator
    | UpdateOperator
    | LeftRightOperator as `$${K}`]?: MacroFunction;
};
