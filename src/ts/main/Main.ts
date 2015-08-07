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
		private inFilePath: string;
		private outFilePath: string;
		private isOverwriteAllowed: boolean = false;
		private indentChar: string;

		constructor() {
			this.log(chalk.bold('\nPair Markup Language processor.') + '   Version: ___PACKAGE_VERSION___\n');
			
			this.args = process.argv.slice(2);
			//illa.Log.info(chalk.cyan('Arguments: ') + args.join(', '));
			
			this.command = this.args.shift();
			this.inFilePath = this.args.pop();
			this.parseOptions();
			
			switch (this.command) {
				case 'l':
				case 'lint':
					this.loadInFile();
					this.log(chalk.bold('Linting ' + this.inFilePath + ' ...'));
					
					var linter = new pml.Linter();
					linter.setLogMessages(true);
					linter.lint(this.inFileContents);
					break;
				case 't':
				case 'tidy':
					this.loadInFile();
					this.log(chalk.bold('Tidying ' + this.inFilePath + ' ...'));
					
					if (!this.outFilePath) this.isOverwriteAllowed = true;
					this.checkOutFileExists();
					
					var tidier = new pml.Tidier();
					if (illa.isString(this.indentChar)) {
						tidier.setIndentChar(this.indentChar);
					}
					
					var outFileContents = tidier.tidy(this.inFileContents);
					this.writeOutFile(this.outFilePath || this.inFilePath, outFileContents);
					break;
				case 'h':
				case 'html':
					this.loadInFile();
					this.log(chalk.bold('Converting ' + this.inFilePath + ' to HTML ...'));
					
					if (!this.outFilePath) {
						this.warn('No output file specified.');
						process.exit(1);
					}
					this.checkOutFileExists();
					
					var parser = new pml.Parser();
					
					var htmlStringer = new pml.HtmlStringer();
					if (illa.isString(this.indentChar)) {
						htmlStringer.setIndentChar(this.indentChar);
					}
					
					var outFileContents = htmlStringer.stringify(parser.parse(this.inFileContents));
					this.writeOutFile(this.outFilePath, outFileContents);
					break;
				case '?':
				case 'help':
					this.log('Usage: ' + chalk.bold('pml [command] [options...] [input file]'));
					this.log(chalk.bold('\nCommands:') + `
?, help ................... Displays this help.
h, html ................... Generates HTML from the input file.
t, tidy ................... Tidies the input file.
l, lint ................... Lints the input file.
`);
					this.log(chalk.bold('\nOptions for HTML mode:') + `
-o, --out [output file] ... Required. Specifies output file path.
-ow, --overwrite .......... Overwrite existing output file(s).
--indentChar [string] ..... Specifies the character(s) used for indentation.
`);
					this.log(chalk.bold('\nOptions for Tidy mode:') + `
-o, --out [output file] ... Specifies output file path. If not specified,
                            defaults to the input file.
-ow, --overwrite .......... Overwrite existing output file(s).
--indentChar [string] ..... Specifies the character(s) used for indentation.
`);
					break;
				default:
					this.warn('Command not recognized.');
					this.log('Please specify a valid command, or issue \'pml help\' for more information.');
			}
		}
		
		parseOptions(): void {
			for (var i = 0, n = this.args.length; i < n; i++) {
				var arg = this.args[i];
				switch (arg) {
					case '-o':
					case '--out':
						this.outFilePath = this.args[++i];
						if (!this.outFilePath) {
							this.warn(arg + ' is missing the file parameter.');
							process.exit(1);
						}
						break;
					case '-ow':
					case '--overwrite':
						this.isOverwriteAllowed = true;
						break;
					case '--indentChar':
						this.indentChar = this.args[++i];
						if (!illa.isString(this.indentChar)) {
							this.warn(arg + ' is missing the string parameter.');
							process.exit(1);
						}
						break;
					default:
						this.warn('Invalid option: ' + arg);
						process.exit(1);
				}
			}
		}
		
		loadInFile(): void {
			if (!fs.existsSync(this.inFilePath)) {
				this.warn('Input file not found.');
				process.exit(1);
			}
			
			this.inFileContents = fs.readFileSync(this.inFilePath, 'utf8');
		}
		
		checkOutFileExists(): void {
			if (!this.isOverwriteAllowed && fs.existsSync(this.outFilePath)) {
				this.warn('Output file already exists.');
				this.log('Use \'--overwrite\' to ignore.');
				process.exit(1);
			}
		}
		
		writeOutFile(outFilePath: string, outFileContents: string): void {
			fs.writeFileSync(outFilePath, outFileContents);
			this.success('Output written to ' + outFilePath + '.');
		}
		
		warn(...args): void {
			illa.Log.warn(chalk.yellow.bold(args.join(' ')));
		}
		
		success(...args): void {
			illa.Log.info(chalk.green(args.join(' ')));
		}
		
		log(...args): void {
			illa.Log.log(args.join(' '));
		}
	}
}