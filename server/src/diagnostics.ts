import {
	TextDocument,
	Diagnostic,
	DiagnosticSeverity,
} from 'vscode-languageserver';
import { TerminalNode } from 'antlr4ts/tree/TerminalNode';
import { ConstructorDeclarationContext, ClassDeclarationContext } from 'java-ast/dist/parser/JavaParser';
import { ErrorNode } from 'antlr4ts/tree/ErrorNode';
import { ParseTree } from 'antlr4ts/tree/ParseTree'
import * as server from './server'
import * as parser from './parser'
import * as preProcessingClass from './preprocessing'
import * as pStandards from './grammer/terms/preprocessingsnippets'
import * as log from './scripts/syslogs'
import * as sketch from './sketch';

const fs = require('fs');

// Error Node contents
// Array because there can be multiple error nodes
// Defaults to "NO"
let errorNodeContents: string[] = []
export let errorNodeLine: number[] = []
let errorNodeReasons: string[] = []
let errorNodeCount = 0
let totalErrorCount = 0

// Diagnostics report based on Error Node
export async function checkForRealtimeDiagnostics(processedTextDocument: TextDocument): Promise<void> {
	let settings = await server.getDocumentSettings(processedTextDocument.uri);
	let problems = 0;
	let errorLine : number = 0
	let errorDocName : string = ''
	let errorDocUri : string = ''

	//Create a diagnostic report per .pde file (tab)
	let fileDiagnostics = new Map<string,  Diagnostic[]>()
	sketch.contents.forEach(function(value, key : string){
		let emptyDiag : Diagnostic[] = []

		fileDiagnostics.set(key, emptyDiag)
	})
	
	errorNodeLine.forEach(function(javaErrorLine, index){
		// Get the real error line number
		if (sketch.transformMap.get(javaErrorLine)) {
			errorLine = sketch.transformMap.get(javaErrorLine)!.lineNumber
			errorDocName =  sketch.transformMap.get(javaErrorLine)!.fileName
			errorDocUri = sketch.uri+errorDocName
		}

		let diagnostics = fileDiagnostics.get(errorDocName);

		if(problems < settings.maxNumberOfProblems && diagnostics){
			problems++;
			let diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					// Fix position Values
					start: {
						line: errorLine-1,
						character: 0
					},
					end: {
						line: errorLine-1,
						character: 200
					}
				},
				message: `Error found`,
				source: `in Source File`
			}
			if (server.hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: errorDocUri,
							range: Object.assign({}, diagnostic.range)
						},
						message: `${errorNodeReasons[index]}`
					}
				];
			}
			diagnostics.push(diagnostic);
			fileDiagnostics.set(errorDocName, diagnostics)
		}
	})

	//Send all diagnostic reports to the client
	for (let [file, diagnostics] of fileDiagnostics)  {
		let fileUri = sketch.uri+file
		server.connection.sendDiagnostics({uri: fileUri, diagnostics})
	}
	
}

function setErrorNodeBackToDefault(){
	errorNodeContents = []
	errorNodeLine = []
	errorNodeCount = 0
	totalErrorCount = 0
}

export function cookCompilationDiagnostics(pwd: string){
	// If one error is fixed it's not popped from stack - check
	try {  
		let data = fs.readFileSync(`${__dirname}/compile/error.txt`, 'utf-8')
		if(data == ''){
			// No Error on Compilation
			setErrorNodeBackToDefault()
			log.writeLog(`No error on Compilation`)
		} else if(data.split(`:`)[0] == `Note`){
			// Compilation warning
			setErrorNodeBackToDefault()
			log.writeLog(`Compilation warning encountered`)
		} else {
			setErrorNodeBackToDefault()
			let tempSplit = data.split('\n')
			let tempoErrorCount = tempSplit[tempSplit.length-2]
			let tempo2ErrorCount = tempoErrorCount.split(" ")
			totalErrorCount = +tempo2ErrorCount[0]
			
			tempSplit.forEach(function(line:string, index: number){
				if(line.includes(`${pwd}`)){
					let innerSplit = line.split(":")

					// Windows paths have a colon after the drive letter
					// Shifts the error colon by one in the array
					let splitIndex
					if(process.platform === 'win32') {
						splitIndex = 2
					}
					else {
						splitIndex = 1
					}

					// Handling line number based on current Behaviour - since preprocessing is done
					if(preProcessingClass.defaultBehaviourEnable){
						errorNodeLine[errorNodeCount] = +innerSplit[splitIndex] - pStandards.reduceLineDefaultBehaviour
					} else if(preProcessingClass.methodBehaviourEnable){
						errorNodeLine[errorNodeCount] = +innerSplit[splitIndex] - pStandards.reduceLineMethodBehaviour
					}
					let localIndex = index + 1
					errorNodeReasons[errorNodeCount] = line.split("error:")[1]
					while(true){
						if(tempSplit[localIndex].includes(`${pwd}`) || 
							tempSplit[localIndex].includes(`error`) ||
							tempSplit[localIndex].includes(`errors`)) {
							break
						} else {
							errorNodeReasons[errorNodeCount]  = `${errorNodeReasons[errorNodeCount]}\n ${tempSplit[localIndex]}`
							localIndex+=1
						}
					}
					errorNodeCount += 1
				}
			})
			// Place a break point
			log.writeLog(`[[ERR]] - Compiler throws errors check \`server\/out\/compile\/error\.txt\``)
		}
	} catch(e) {
		log.writeLog(`[[ERR]] - Problem with cooking diagnostics`)
	}
}
		}
	})
	// Delete current Error if the Error Node is resolved
	errorNodeContents.forEach(function(error, index){
		if(!(processedText.indexOf(error as string) > -1)){
			delete errorNodeContents[index]
			delete errorNodeReasons[index]
		}
	})
}