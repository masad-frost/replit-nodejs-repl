.PHONY: run

run: node_modules
	chmod +x repl.js
	./repl.js index.js

node_modules:
	npm install