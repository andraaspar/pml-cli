/// <reference path='../../../lib/lib.core.es6.d.ts'/>

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
		private outputResultToStdOut: boolean;
		
		private args: string[];
		private command: string;
		private inFileContents: string;
		private inFilePath: string;
		private outFilePath: string;
		private isOverwriteAllowed: boolean = false;
		private indentChar: string;
		private eolChar: string;
		
		private convertIgnoredValueToNode: boolean;
		
		private noEndTags: string[];
		private inlineTags: string[];
		private inlineDependingOnContentTags: string[];
		private nonReplaceableCharacterTags: string[];
		private preformattedTags: string[];
		private noLineBreakExpansionTags: string[];
		private prettyPrint: boolean;
		private tabExpansion: string;
		private expandLineBreaks: boolean;
		private expandTabs: boolean;
		private attributeChar: string;

		constructor() {
			this.log(chalk.bold('Par Markup Language processor.') + '   Version: ___PACKAGE_VERSION___\n');
			
			this.args = process.argv.slice(2);
			//illa.Log.info(chalk.cyan('Arguments: ') + args.join(', '));
			
			this.command = this.args.shift();
			this.inFilePath = this.args.pop();
			this.parseOptions();
			
			this.argsRead = true;
			this.outputResultToStdOut = !this.outFilePath;
			this.flushLogBuffer();
			
			switch (this.command) {
				case '?':
				case 'help':
					this.onInFileLoaded();
					break;
				default:
					this.loadInFile();
			}
		}
		
		onInFileLoaded(): void {
			switch (this.command) {
				case 'l':
				case 'lint':
					this.outputResultToStdOut = false;
					this.flushLogBuffer();
					
					this.log(chalk.bold('Linting ' + this.inFilePath + ' ...'));
					
					var linter = new pml.Linter();
					linter.setLogMessages(true);
					linter.lint(this.inFileContents);
					break;
				case 't':
				case 'tidy':
					this.log(chalk.bold('Tidying ' + this.inFilePath + ' ...'));
					
					if (this.outFilePath) {
						this.checkOutFileExists();
					}
					
					var tidier = new pml.Tidier();
					if (illa.isString(this.indentChar)) {
						tidier.setIndentChar(this.indentChar);
					}
					if (illa.isString(this.eolChar)) {
						tidier.setEolChar(this.eolChar);
					}
					if (illa.isBoolean(this.convertIgnoredValueToNode)) {
						tidier.setConvertIgnoredValueToNode(this.convertIgnoredValueToNode);
					}
					
					var outFileContents = tidier.tidy(this.inFileContents);
					
					this.writeOutput(this.outFilePath, outFileContents);
					break;
				case 'h':
				case 'html':
					this.log(chalk.bold('Converting ' + this.inFilePath + ' to HTML ...'));
					
					if (!this.outFilePath) {
						this.error('No output file specified.');
						this.fail(1);
					}
					this.checkOutFileExists();
					
					var htmlStringer = new pml.HtmlStringer();
					if (illa.isString(this.indentChar)) {
						htmlStringer.setIndentChar(this.indentChar);
					}
					if (illa.isString(this.eolChar)) {
						htmlStringer.setEolChar(this.eolChar);
					}
					if (illa.isArray(this.noEndTags)) {
						htmlStringer.setNoEndTags(this.noEndTags);
					}
					if (illa.isArray(this.inlineTags)) {
						htmlStringer.setInlineTags(this.inlineTags);
					}
					if (illa.isArray(this.inlineDependingOnContentTags)) {
						htmlStringer.setInlineDependingOnContentTags(this.inlineDependingOnContentTags);
					}
					if (illa.isArray(this.nonReplaceableCharacterTags)) {
						htmlStringer.setNonReplaceableCharacterTags(this.nonReplaceableCharacterTags);
					}
					if (illa.isArray(this.preformattedTags)) {
						htmlStringer.setPreformattedTags(this.preformattedTags);
					}
					if (illa.isArray(this.noLineBreakExpansionTags)) {
						htmlStringer.setNoLineBreakExpansionTags(this.noLineBreakExpansionTags);
					}
					if (illa.isBoolean(this.prettyPrint)) {
						htmlStringer.setPrettyPrint(this.prettyPrint);
					}
					if (illa.isString(this.tabExpansion)) {
						htmlStringer.setTabExpansion(this.tabExpansion);
					}
					if (illa.isBoolean(this.expandLineBreaks)) {
						htmlStringer.setExpandLineBreaks(this.expandLineBreaks);
					}
					if (illa.isBoolean(this.expandTabs)) {
						htmlStringer.setExpandTabs(this.expandTabs);
					}
					if (illa.isString(this.attributeChar)) {
						htmlStringer.setAttributeChar(this.attributeChar);
					}
					
					var outFileContents = htmlStringer.stringify(pml.Parser.parse(this.inFileContents));
					this.writeOutput(this.outFilePath, outFileContents);
					break;
				case '?':
				case 'help':
					this.outputResultToStdOut = false;
					this.flushLogBuffer();
					
					this.log('Usage: ' + chalk.bold('pml [command] [options...] [input file or STDIN]'));
					this.log(chalk.bold('\nCommands:') + `
?, help ................... Displays this help.
h, html ................... Generates HTML from the input file.
t, tidy ................... Tidies the input file.
l, lint ................... Lints the input file.
`);
					this.log(chalk.bold('Options for HTML mode:') + `
--attribute-char [string] . Set the character that attribute node names start
                            with. Default: '@'
--compress, -c ............ Remove unnecessary white space.
--eol-char [string] ....... Specifies the character(s) used for line breaks.
--expand-line-breaks ...... Replace EOL characters with <br/>s.
--expand-tabs ............. Replace tab characters with the tab expansion
                            string.
--indent-char [string] .... Specifies the character(s) used for indentation.
--inline-tags [pml] ....... Names of tags that are inline. Ex. <span>. Node
                            names will be read from [pml]'s root.
--inline-doc-tags [pml] ... Names of tags that are inline only if their child
                            tags are all inline. Ex. <a>. Node names will be
                            read from [pml]'s root.
--no-end-tags [pml] ....... Names of tags that have no closing tag. Ex. <img>.
                            Node names will be read from [pml]'s root.
--no-lbe-tags [pml] ....... Names of tags in which no line break expansion
                            should be done. Ex. <title>. Node names will be
                            read from [pml]'s root.
--nrc-tags [pml] .......... Names of non-replaceable character tags. Ex.
                            <script>. Node names will be read from [pml]'s
                            root.
--out, -o [output file] ... Specifies output file path. If not specified,
                            defaults to stdout.
--overwrite, -ow .......... Overwrite existing output file(s).
--pre-tags [pml] .......... Names of preformatted tags. Ex. <pre>. Node names
                            will be read from [pml]'s root.
--tab-expansion [string] .. Set the character(s) tabs will be expanded to.
`);
					this.log(chalk.bold('Options for Tidy mode:') + `
--eol-char [string] ....... Specifies the character(s) used for line breaks.
--ignored-to-node, -i2n ... Convert ignored values (text outside child nodes)
                            to a node rather than a comment.
--indent-char [string] .... Specifies the character(s) used for indentation.
--out, -o [output file] ... Specifies output file path. If not specified,
                            defaults to stdout.
--overwrite, -ow .......... Overwrite existing output file(s).
--overwrite-source ........ Overwrite input file(s) with the new content.
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
					case '--attribute-char':
						this.attributeChar = this.args[++i];
						if (!illa.isString(this.attributeChar)) {
							this.error(arg + ' is missing the string parameter.');
							this.fail(1);
						}
						break;
					case '-c':
					case '--compress':
						this.prettyPrint = false;
						break;
					case '--eol-char':
						this.eolChar = this.args[++i];
						if (!illa.isString(this.eolChar)) {
							this.error(arg + ' is missing the string parameter.');
							this.fail(1);
						}
						break;
					case '--expand-line-breaks':
						this.expandLineBreaks = true;
						break;
					case '--expand-tabs':
						this.expandTabs = true;
						break;
					case '--i2n':
					case '--ignored-to-node':
						this.convertIgnoredValueToNode = true;
						break;
					case '--indent-char':
						this.indentChar = this.args[++i];
						if (!illa.isString(this.indentChar)) {
							this.error(arg + ' is missing the string parameter.');
							this.fail(1);
						}
						break;
					case '--inline-doc-tags':
						try {
							this.inlineDependingOnContentTags = this.getChildNames(pml.Parser.parse(this.args[++i]));
						} catch (e) {
							this.error(e);
							this.error(arg + ' needs valid PML as parameter.');
							this.fail(1);
						}
						break;
					case '--inline-tags':
						try {
							this.inlineTags = this.getChildNames(pml.Parser.parse(this.args[++i]));
						} catch (e) {
							this.error(e);
							this.error(arg + ' needs valid PML as parameter.');
							this.fail(1);
						}
						break;
					case '--no-end-tags':
						try {
							this.noEndTags = this.getChildNames(pml.Parser.parse(this.args[++i]));
						} catch (e) {
							this.error(e);
							this.error(arg + ' needs valid PML as parameter.');
							this.fail(1);
						}
						break;
					case '--no-lbe-tags':
						try {
							this.noLineBreakExpansionTags = this.getChildNames(pml.Parser.parse(this.args[++i]));
						} catch (e) {
							this.error(e);
							this.error(arg + ' needs valid PML as parameter.');
							this.fail(1);
						}
						break;
					case '--nrc-tags':
						try {
							this.nonReplaceableCharacterTags = this.getChildNames(pml.Parser.parse(this.args[++i]));
						} catch (e) {
							this.error(e);
							this.error(arg + ' needs valid PML as parameter.');
							this.fail(1);
						}
						break;
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
					case '--overwrite-source':
						this.outFilePath = this.inFilePath;
						this.isOverwriteAllowed = true;
						break;
					case '--pre-tags':
						try {
							this.preformattedTags = this.getChildNames(pml.Parser.parse(this.args[++i]));
						} catch (e) {
							this.error(e);
							this.error(arg + ' needs valid PML as parameter.');
							this.fail(1);
						}
						break;
					case '--tab-expansion':
						this.tabExpansion = this.args[++i];
						if (!illa.isString(this.tabExpansion)) {
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
		
		getChildNames(node: pml.Node): string[] {
			var result: string[] = [];
			for (var i = 0, n = node.children.length; i < n; i++) {
				result.push(node.children[i].name);
			}
			return result;
		}
		
		loadInFile(): void {
			if (this.inFilePath == 'STDIN') {
				this.inFileContents = '';
				process.stdin.setEncoding('utf8');
				process.stdin.on('data', illa.bind(this.onStdinData, this));
				process.stdin.on('end', illa.bind(this.onInFileLoaded, this));
			} else {
				if (!fs.existsSync(this.inFilePath)) {
					this.error('Input file not found.');
					this.fail(1);
				}
				
				this.inFileContents = fs.readFileSync(this.inFilePath, 'utf8');
				this.onInFileLoaded();
			}
		}
		
		onStdinData(data: string): void {
			this.inFileContents += data;
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
			if (this.argsRead && !this.outputResultToStdOut) {
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
						if (!this.outputResultToStdOut) {
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