/// <reference path='../../../node_modules/typescript/bin/lib.core.es6.d.ts'/>

/// <reference path='../../../lib/node.d.ts'/>

/// <reference path='../../../lib/illa/_module.ts'/>
/// <reference path='../../../lib/illa/Log.ts'/>

/// <reference path='../../../lib/pml/Tidier.ts'/>

/// <reference path='../chalk.d.ts'/>


illa.GLOBAL.fs = require('fs');
illa.GLOBAL.chalk = require('chalk');

module main {
	export class Main {

		private static instance = new Main();

		constructor() {
			var args = process.argv.slice(2);
			illa.Log.info(chalk.cyan('Arguments: ') + args.join(', '));
			
			var filePath = args[0];
			if (!illa.isString(filePath)) {
				illa.Log.info(chalk.yellow('Please specify an input file.'));
				return;
			}
			var outFilePath = args[1];
			if (!illa.isString(outFilePath)) {
				illa.Log.info(chalk.yellow('Please specify an output file path.'));
				return;
			}
			
			var fileContents = fs.readFileSync(filePath, 'utf8');
			
			var tidier = new pml.Tidier();
			var tidyFileContents = tidier.tidy(fileContents);
			
			fs.writeFileSync(outFilePath, tidyFileContents);
			
			illa.Log.info(chalk.green('Output file written.'));
		}
	}
}