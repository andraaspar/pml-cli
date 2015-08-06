/// <reference path='../../../node_modules/typescript/bin/lib.core.es6.d.ts'/>

/// <reference path='../../../lib/node.d.ts'/>

/// <reference path='../../../lib/illa/_module.ts'/>
/// <reference path='../../../lib/illa/Log.ts'/>

/// <reference path='../../../lib/pml/HtmlStringer.ts'/>
/// <reference path='../../../lib/pml/Linter.ts'/>
/// <reference path='../../../lib/pml/Parser.ts'/>
/// <reference path='../../../lib/pml/Tidier.ts'/>

/// <reference path='../chalk.d.ts'/>


illa.GLOBAL.fs = require('fs');
illa.GLOBAL.chalk = require('chalk');

module pml_cli {
	export class Main {

		private static instance = new Main();
		
		private args: string[];
		private command: string;
		private inFileContents: string;
		private outFilePath: string;

		constructor() {
			this.args = process.argv.slice(2);
			//illa.Log.info(chalk.cyan('Arguments: ') + args.join(', '));
			
			this.command = this.args.shift();
			
			var inFilePath = this.args.pop();
			if (!fs.existsSync(inFilePath)) {
				this.warn('Input file not found.');
				process.exit(1);
			}
			
			this.inFileContents = fs.readFileSync(inFilePath, 'utf8');
			
			switch (this.command) {
				case 'l':
				case 'lint':
					var linter = new pml.Linter();
					linter.setLogMessages(true);
					linter.lint(this.inFileContents);
					break;
				case 't':
				case 'tidy':
					this.checkOutFileArg();
					var tidier = new pml.Tidier();
					var outFileContents = tidier.tidy(this.inFileContents);
					this.writeOutFile(outFileContents);
					break;
				case 'h':
				case 'html':
					this.checkOutFileArg();
					var parser = new pml.Parser();
					var htmlStringer = new pml.HtmlStringer();
					var outFileContents = htmlStringer.stringify(parser.parse(this.inFileContents));
					this.writeOutFile(outFileContents);
					break;
				default:
					this.log('PML processor. Version: ___PACKAGE_VERSION___');
					this.log('Usage: pml [command] [options] [input file]');
					this.log(chalk.cyan('\nCommands:') + `
help ....... Displays this help.
h, html .... Generates HTML from the input file.
t, tidy .... Tidies the input file.
l, lint .... Lints the input file.
`);
			}
		}
		
		checkOutFileArg(): void {
			for (var i = 0, n = this.args.length; i < n; i++) {
				var arg = this.args[i];
				if (arg == '-o' || arg == '--out') {
					this.outFilePath = this.args[i + 1];
					if (!this.outFilePath) {
						this.warn('No output file specified.');
						process.exit(1);
					}
					if (fs.existsSync(this.outFilePath)) {
						this.warn('Output file already exists.');
						process.exit(1);
					}
					break;
				}
			}
		}
		
		writeOutFile(outFileContents): void {
			if (this.outFilePath) {
				fs.writeFileSync(this.outFilePath, outFileContents);
				this.success('Output file written.');
			} else {
				this.warn('No output file specified.');
			}
		}
		
		warn(...args): void {
			illa.Log.warn(chalk.yellow(args.join(' ')));
		}
		
		success(...args): void {
			illa.Log.info(chalk.green(args.join(' ')));
		}
		
		info(...args): void {
			illa.Log.info(args.join(' '));
		}
		
		log(...args): void {
			illa.Log.log(args.join(' '));
		}
	}
}