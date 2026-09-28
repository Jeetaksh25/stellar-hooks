/**
 * Codemod: v0.2.0 - useAccountMerge API Migration
 *
 * Migrates consumer code from the pre-v0.2.0 `useAccountMerge()` API to the
 * modern options + `submit()` pattern.
 *
 * Before:
 *   const { merge, status, hash } = useAccountMerge();
 *   await merge("GDEST...", { confirm: true, memo: "closing" });
 *
 * After:
 *   const { submit, status, hash } = useAccountMerge({
 *     destination: "GDEST...",
 *     memo: "closing"
 *   });
 *   await submit();
 */

module.exports = function transformer(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  let hasModifications = false;

  // Find all calls to useAccountMerge()
  root.find(j.CallExpression, {
    callee: {
      type: "Identifier",
      name: "useAccountMerge",
    },
  }).forEach((callPath) => {
    // Only migrate if called with 0 arguments (the old API pattern)
    if (callPath.node.arguments.length > 0) {
      return;
    }

    const parentDecl = callPath.parentPath;
    if (!parentDecl || parentDecl.node.type !== "VariableDeclarator") {
      return;
    }

    const pattern = parentDecl.node.id;
    let mergeIdentifierName = null;
    let submitIdentifierName = "submit";

    if (pattern.type === "ObjectPattern") {
      // Find `merge` or aliased `merge: customName` in destructuring
      pattern.properties.forEach((prop) => {
        if (
          prop.type === "Property" ||
          prop.type === "ObjectProperty"
        ) {
          const keyName = prop.key.name;
          if (keyName === "merge") {
            mergeIdentifierName = prop.value.name;
            prop.key.name = "submit";
            if (prop.shorthand) {
              prop.shorthand = false;
              prop.value.name = "submit";
              submitIdentifierName = "submit";
            } else {
              submitIdentifierName = prop.value.name;
            }
            hasModifications = true;
          }
        }
      });
    }

    if (!mergeIdentifierName) {
      mergeIdentifierName = "merge";
    }

    // Find the scope or parent block to locate calls to merge()
    let searchScope = callPath;
    while (
      searchScope.parentPath &&
      searchScope.node.type !== "FunctionDeclaration" &&
      searchScope.node.type !== "FunctionExpression" &&
      searchScope.node.type !== "ArrowFunctionExpression" &&
      searchScope.node.type !== "Program"
    ) {
      searchScope = searchScope.parentPath;
    }

    const scopeRoot = j(searchScope.node);
    let extractedDestination = null;
    let extractedOptionsProps = [];

    // Find calls to the merge function: merge(destination, options)
    scopeRoot.find(j.CallExpression, {
      callee: {
        type: "Identifier",
        name: mergeIdentifierName,
      },
    }).forEach((mergeCallPath) => {
      const args = mergeCallPath.node.arguments;
      if (args.length > 0 && !extractedDestination) {
        extractedDestination = args[0];
      }

      if (args.length > 1 && args[1].type === "ObjectExpression") {
        args[1].properties.forEach((p) => {
          // Ignore deprecated `confirm` option
          const propName = p.key ? (p.key.name || p.key.value) : null;
          if (propName !== "confirm") {
            extractedOptionsProps.push(p);
          }
        });
      }

      // Transform merge(...) to submit() / submitIdentifierName()
      mergeCallPath.node.callee.name = submitIdentifierName;
      mergeCallPath.node.arguments = [];
      hasModifications = true;
    });

    // Populate arguments for useAccountMerge({ destination, ... })
    const configProperties = [];
    if (extractedDestination) {
      configProperties.push(
        j.property("init", j.identifier("destination"), extractedDestination)
      );
    }
    extractedOptionsProps.forEach((p) => {
      configProperties.push(p);
    });

    if (configProperties.length > 0) {
      callPath.node.arguments = [j.objectExpression(configProperties)];
      hasModifications = true;
    }
  });

  return hasModifications ? root.toSource(options) : fileInfo.source;
};

module.exports.parser = "tsx";
