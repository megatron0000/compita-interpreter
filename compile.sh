#!/usr/bin/env bash

./node_modules/.bin/nearleyc ./src/compita/verbosetree/grammar.ne -o ./src/compita/verbosetree/grammar.ts
# tsc --target ES5 --outDir build  ts/index.ts
./node_modules/.bin/tsc
./node_modules/.bin/browserify build/index.js -o build/bundle.js

echo "Done (ts) !"

g++ src/compita/runtime/interpreter.cpp -o build/compita/runtime/interpreter.o

echo "Done (cpp) !"
