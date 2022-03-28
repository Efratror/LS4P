import * as lsp from 'vscode-languageserver'

const fs = require('fs')
const pathM = require('path')


export let path : string = ''
export let uri : string = ''
export let name : string = '';
export let contents  = new Map<string, string>()
export let created = false;

export interface IOriginalTab {
	lineNumber: number;	//Line number in the orgininal file
	fileName: string;	//Name of the original file
}
export let transformDict = new Map<number, IOriginalTab>()


export function createSketch(textDocument: lsp.TextDocument) {
	
	uri = pathM.dirname(textDocument.uri)+'/'
	path = getPathFromUri(uri)
	name = pathM.basename(path)

	try {
		let mainFileName = name+'.pde'
		let mainFileContents = fs.readFileSync(path+mainFileName, 'utf-8')

		contents.set(mainFileName, mainFileContents)
	}
	catch (e) {
		console.log("Some thing went wrong while loading the main file")
		console.log(e)
		return
	}

	try{
		let fileNames = fs.readdirSync(path)
		fileNames.forEach((fileName : string) =>{
			if (fileName.endsWith('.pde') && !fileName.includes(name)){
				let tabContents = fs.readFileSync(path+fileName, 'utf-8')
				contents.set(fileName, tabContents)
			}
		});
	}
	catch(e) {
		console.log("Some thing went wrong while loading the other files")
		console.log(e)
		return
	}

	
	created = true
}

function getPathFromUri(uri : string) : string {
	let path = uri.replace('file:///', '')
	path =  path.replace('%3A', ':')

	return path
}

export function getUriFromPath(path : string) : string  {
	let tempUri = path.replace(':', '%3A')
	tempUri = 'file:///'+ + tempUri

	return tempUri
}