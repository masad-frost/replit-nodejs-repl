.PHONY: run

run: node_modules
	chmod +x ./rundir/repl.js
	cd home && ../rundir/repl.js ./index.js

node_modules:
	npm install