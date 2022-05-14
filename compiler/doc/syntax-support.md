# Supported javascript/typescript syntax

Since there drastic differences bewteen the browser environment and
the mlog runtime on mindustry, not all of the existent javascript
features are supported. Bellow are lists containing the most significant supported and
unsupported features, along with some that could be supported in the future.

## Javascript

### Variable declarations

You can declare variables (global or scoped) with the `let`, `const` and `var` keywords

Behavior:

- `const` variables holding a literal will inline that value on the output code.

```js
const foo = "string";
print(foo);
print(foo, " and another");
```

```
print "string"
print "string"
print " and another"
```

- `var` behaves the same as `let` (see limitations)

Limitations:

- Variables declared with `var` are not hoisted.

### If/else statements

You can use `if` and `else` statements just like in regular javascript without limitations.

```js
const message = getBuilding("message1");
const building = getLink(0);

if (building.type === Blocks.message) {
  print("Linked to message block");
} else if (building.type === Blocks.memoryCell) {
  print("Ready to read memory");
} else {
  print("Linked to some block");
}

printFlush(message);
```

### Functions

You can declare regular functions using your preferred style:

```js
function classic() {}

const arrow = () => {};

const other = function () {};
```

Behavior:

- Functions will be automatically inlined when the size of the body is smaller than the size of the call

Limitations:

- Functions can only be bound to constants
- No `this` context for any kind of function
- Functions cannot act as constructors
- No recursion support
- Functions declarations are not hoisted
- No proper support for closures
- No support for generators
- No support for `async`/`await`

### For loops

You can define the regular style `for` loops:

```js
for (let i = 0; i < 10; i++) {
  print(i);
}
printFlush(getBuilding("message1"));
```

Behavior:

- Supports `break` and `continue` statements

Limitations:

- No support for the `for ... of` syntax
- No support for the `for ... in` syntax

### While loop

Repeats the code block while the condition resolves to `true`

```js
let i = 0;
while (i < 10) {
  print(i);
  i++;
}
printFlush(getBuilding("message1"));
```

Behavior:

- Supports `break` and `continue` statements

### Do while loop

Executes the code and repeats it while the condition resolves to `true`

```js
let i = 0;
do {
  print(i);
  i++;
} while (i < 10);
```

Behavior:

- Supports `break` and `continue` statements

### Template strings

Template strings in javascript allow you to interpolate values with strings in
a convenient way.

But since the mlog runtime doesn't support string contenation template are used to
inline mlog code.

The following has it's last line inlined onto the output.

```js
const conveyor = getBuilding("conveyor1");
const message = getBuilding("message1");

print(conveyor.x, conveyor.y);

`printflush ${message}`;
```

```
sensor &t0 conveyor1 @x
sensor &t1 conveyor1 @y
print &t0
print &t1
printflush message1
end
```

## Typescript

### Enums

You can declare `const` `enum`s on your code as if it were regular typescript

```ts
const enum Status {
  traveling,
  mining,
}
```

Behavior:

- Each enum member will be bound to a number by default (with auto incrementing indexes), they can also be string literals
- Just like [constants](#variable-declarations), enum members are replaced with their literal values

Limitations:

- All enums must be `const`, since dynamic objects are not supported in the mlog runtime