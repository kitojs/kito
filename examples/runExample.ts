#!/usr/bin/env ts-node

const exampleName = process.argv[2];

if (!exampleName) {
  console.error(
    "You must pass the name of the example, e.g.: pnpm ex:run basic",
  );

  process.exit(1);
}

import(`./src/${exampleName}.ts`);
