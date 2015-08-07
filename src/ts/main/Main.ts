/// <reference path='../../../node_modules/typescript/bin/lib.core.es6.d.ts'/>

/// <reference path='../../../lib/node.d.ts'/>

/// <reference path='../../../lib/illa/_module.ts'/>
/// <reference path='../../../lib/illa/Log.ts'/>

/// <reference path='../../../lib/pml/HtmlStringer.ts'/>
/// <reference path='../../../lib/pml/Linter.ts'/>
/// <reference path='../../../lib/pml/Message.ts'/>
/// <reference path='../../../lib/pml/Parser.ts'/>
/// <reference path='../../../lib/pml/Tidier.ts'/>

/// <reference path='../chalk.d.ts'/>


illa.GLOBAL.fs = require('fs');
illa.GLOBAL.chalk = require('chalk');

module pml_cli {
	export class Main {

		private static instance = new Main();
		
		private messages: pml.Message[] = [];
		private argsRead: boolean = false;
		private outputToStdOut: boolean;
		
		private args: string[];
		private command: string;
		private inFileContents: string;
		private inFilePath: string;
		private outFilePath: string;
		private isOverwriteAllowed: boolean = false;
		private indentChar: string;

		constructor() {
			this.log(chalk.bold('Pair Markup Language processor.') + '   Version: ___PACKAGE_VERSION___\n');
			
			this.args = process.argv.slice(2);
			//illa.Log.info(chalk.cyan('Arguments: ') + args.join(', '));
			
			this.command = this.args.shift();
			this.inFilePath = this.args.pop();
			this.parseOptions();
			
			this.argsRead = true;
			this.outputToStdOut = !this.outFilePath;
			this.flushLogBuffer();
			
			switch (this.command) {
				case 'l':
				case 'lint':
					this.outputToStdOut = false;
					this.flushLogBuffer();
					
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
					
					if (this.outFilePath) {
						this.checkOutFileExists();
					}
					
					var tidier = new pml.Tidier();
					if (illa.isString(this.indentChar)) {
						tidier.setIndentChar(this.indentChar);
					}
					
					var outFileContents = tidier.tidy(this.inFileContents);
					
					this.writeOutput(this.outFilePath, outFileContents);
					break;
				case 'h':
				case 'html':
					this.loadInFile();
					this.log(chalk.bold('Converting ' + this.inFilePath + ' to HTML ...'));
					
					if (!this.outFilePath) {
						this.error('No output file specified.');
						this.fail(1);
					}
					this.checkOutFileExists();
					
					var parser = new pml.Parser();
					
					var htmlStringer = new pml.HtmlStringer();
					if (illa.isString(this.indentChar)) {
						htmlStringer.setIndentChar(this.indentChar);
					}
					
					var outFileContents = htmlStringer.stringify(parser.parse(this.inFileContents));
					this.writeOutput(this.outFilePath, outFileContents);
					break;
				case '?':
				case 'help':
					this.outputToStdOut = false;
					this.flushLogBuffer();
					
					this.log('Usage: ' + chalk.bold('pml [command] [options...] [input file]'));
					this.log(chalk.bold('\nCommands:') + `
?, help ................... Displays this help.
h, html ................... Generates HTML from the input file.
t, tidy ................... Tidies the input file.
l, lint ................... Lints the input file.
`);
					this.log(chalk.bold('\nOptions for HTML mode:') + `
-o, --out [output file] ... Specifies output file path. If not specified,
                            defaults to stdout.
-ow, --overwrite .......... Overwrite existing output file(s).
--indent-char [string] .... Specifies the character(s) used for indentation.
`);
					this.log(chalk.bold('\nOptions for Tidy mode:') + `
-o, --out [output file] ... Specifies output file path. If not specified,
                            defaults to stdout.
-ow, --overwrite .......... Overwrite existing output file(s).
--indent-char [string] .... Specifies the character(s) used for indentation.
`);
					break;
				default:
					this.error('Command not recognized.');
					this.errorInfo('Please specify a valid command, or issue \'pml help\' for more information.');
					this.fail(1);
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
							this.error(arg + ' is missing the file parameter.');
							this.fail(1);
						}
						break;
					case '-ow':
					case '--overwrite':
						this.isOverwriteAllowed = true;
						break;
					case '--indent-char':
						this.indentChar = this.args[++i];
						if (!illa.isString(this.indentChar)) {
							this.error(arg + ' is missing the string parameter.');
							this.fail(1);
						}
						break;
					default:
						this.error('Invalid option: ' + arg);
						this.fail(1);
				}
			}
		}
		
		loadInFile(): void {
			if (!fs.existsSync(this.inFilePath)) {
				this.error('Input file not found.');
				this.fail(1);
			}
			
			this.inFileContents = fs.readFileSync(this.inFilePath, 'utf8');
		}
		
		checkOutFileExists(): void {
			if (!this.isOverwriteAllowed && fs.existsSync(this.outFilePath)) {
				this.error('Output file already exists.');
				this.errorInfo('Use \'--overwrite\' to ignore.');
				this.fail(1);
			}
		}
		
		writeOutput(outFilePath: string, outFileContents: string): void {
			if (outFilePath) {
				fs.writeFileSync(outFilePath, outFileContents);
				this.success('Output written to ' + outFilePath + '.');
			} else {
				process.stdout.write(outFileContents);
			}
		}
		
		error(...args): void {
			this.errorInfo(chalk.yellow.bold(args.join(' ')));
		}
		
		errorInfo(...args): void {
			var message = args.join(' ') + '\n';
			if (this.argsRead) {
				process.stderr.write(message);
			} else {
				this.messages.push(new pml.Message(pml.MessageKind.ERROR, 0, 0, message));
			}
		}
		
		success(...args): void {
			this.log(chalk.green(args.join(' ')));
		}
		
		log(...args): void {
			var message = args.join(' ') + '\n';
			if (this.argsRead && !this.outputToStdOut) {
				process.stdout.write(message);
			} else {
				this.messages.push(new pml.Message(pml.MessageKind.INFO, 0, 0, message));
			}
		}
		
		flushLogBuffer(): void {
			for (var i = 0; i < this.messages.length; i++) {
				var message = this.messages[i];
				switch (message.kind) {
					case pml.MessageKind.ERROR:
					case pml.MessageKind.WARNING:
						process.stderr.write(message.message);
						this.messages.splice(i, 1);
						i--;
						break;
					default:
						if (!this.outputToStdOut) {
							process.stdout.write(message.message);
						}
				}
			}
		}
		
		fail(code: number): void {
			this.flushLogBuffer();
			process.exit(code);
		}
	}
}