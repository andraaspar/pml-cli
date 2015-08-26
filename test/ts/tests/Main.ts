/// <reference path='../../../lib/node.d.ts'/>
/// <reference path='../../../lib/lib.core.es6.d.ts'/>
/// <reference path='../../../lib/illa/_module.ts'/>
/// <reference path='../../../lib/illa/StringUtil.ts'/>

/// <reference path='../jasmine.d.ts'/>

illa.GLOBAL.child_process = require('child_process');
illa.GLOBAL.fs = require('fs');
illa.GLOBAL.path = require('path');
illa.GLOBAL.stream = require('stream');

var tmpFolderPath = 'test/tmp';
if (!fs.existsSync(tmpFolderPath)) fs.mkdirSync(tmpFolderPath);

var inPmlPath = path.join(tmpFolderPath, 'in.pml');
var outPmlPath = path.join(tmpFolderPath, 'out.pml');
var inHtmlPath = path.join(tmpFolderPath, 'in.html');
var outHtmlPath = path.join(tmpFolderPath, 'out.html');

var sh = process.platform == 'win32' ? 'cmd' : 'sh';
var shArg = process.platform == 'win32' ? '/c' : '-c';

describe('pml', function() {
	describe('help', function() {
		it('prints the help', function(done) {
			executePml('help', '', function(out, err) {
				expect(out).toMatch(/\S/);
				expect(err).toBeFalsy();
				done();
			});
		});
	});
	describe('tidy', function() {
		beforeEach(function() {
			unlinkFiles();
		});
		it('writes to stdout by default', function(done) {
			executePml(`tidy STDIN`, `{[|]}\n[foo|]`, function(out, err) {
				expect(out).toEqual(`{[|]}\n[foo|]`);
				expect(err).toBeFalsy();
				done();
			});
		});
		it('reports warnings to stderr', function(done) {
			executePml(`tidy STDIN`, `{[|]}\n[foo]`, function(out, err) {
				expect(out).toEqual(`{[|]}\n[foo|]`);
				expect(err).toMatch(`Added missing name end delimiter.`);
				done();
			});
		});
		it('accepts files from the filesystem', function(done) {
			writeFile(inPmlPath, `{[|]}[foo|]`);
			executePml(`tidy "${inPmlPath}"`, '', function(out, err) {
				expect(out).toEqual(`{[|]}\n[foo|]`);
				expect(err).toBeFalsy();
				done();
			});
		});
		it('writes to a file when --out is specified', function(done) {
			writeFile(inPmlPath, `{[|]}\n[foo|]`);
			executePml(`tidy --out "${outPmlPath}" "${inPmlPath}"`, '', function(out, err) {
				expect(out).toMatch(illa.StringUtil.escapeRegExp(`Output written to ${outPmlPath}`));
				expect(err).toBeFalsy();
				expect(readFile(outPmlPath)).toEqual(`{[|]}\n[foo|]`);
				done();
			});
		});
		it('does not overwrite an existing file', function(done) {
			writeFile(inPmlPath, `{[|]}\n[foo|]`);
			writeFile(outPmlPath, '');
			executePml(`tidy --out "${outPmlPath}" "${inPmlPath}"`, '', function(out, err) {
				expect(err).toMatch(`Output file already exists.`);
				expect(readFile(outPmlPath)).toEqual('');
				done();
			});
		});
		it('overwrites an existing file when --overwrite is specified', function(done) {
			writeFile(inPmlPath, `{[|]}\n[foo|]`);
			writeFile(outPmlPath, '');
			executePml(`tidy --overwrite --out "${outPmlPath}" "${inPmlPath}"`, '', function(out, err) {
				expect(out).toMatch(illa.StringUtil.escapeRegExp(`Output written to ${outPmlPath}`));
				expect(err).toBeFalsy();
				expect(readFile(outPmlPath)).toEqual(`{[|]}\n[foo|]`);
				done();
			});
		});
		it('overwrites the source file when --overwrite-source is specified', function(done) {
			writeFile(inPmlPath, `{[|]}[foo|]`);
			executePml(`tidy --overwrite-source "${inPmlPath}"`, '', function(out, err) {
				expect(out).toMatch(illa.StringUtil.escapeRegExp(`Output written to ${inPmlPath}`));
				expect(err).toBeFalsy();
				expect(readFile(inPmlPath)).toEqual(`{[|]}\n[foo|]`);
				done();
			});
		});
	});
});

function unlinkFiles(): void {
	var paths = [inPmlPath, outPmlPath, inHtmlPath, outHtmlPath];
	for (var path of paths) {
		if (fs.existsSync(path)) {
			fs.unlinkSync(path);
		}
	}
}

function writeFile(filePath: string, content: string): void {
	fs.writeFileSync(filePath, content, {});
}

function readFile(filePath: string): string {
	return fs.readFileSync(filePath, {encoding: 'utf8'});
}

function executePml(args: string, stdin: string, outputHandler: (out: string, err: string) => void): void {
	var cp = child_process.spawn(sh, [shArg, 'node build/pml-cli.js ' + args], {
		cwd: process.cwd(),
		windowsVerbatimArguments: process.platform == 'win32',
		detached: process.platform != 'win32'
	});
	if (stdin) {
		cp.stdin.write(stdin);
		cp.stdin.end();
	}
	var allStdout = '';
	var allStderr = '';
	cp.stdout.setEncoding('utf8');
	cp.stderr.setEncoding('utf8');
	cp.stdout.on('data', function(data: string) {
		allStdout += data;
	});
	cp.stderr.on('data', function(data: string) {
		allStderr += data;
	});
	cp.on('close', function() {
		outputHandler(allStdout, allStderr);
	});
}
