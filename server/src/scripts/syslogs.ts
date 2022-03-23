const exec = require('child_process').exec
const fs = require('fs')
export async function writeLog(logContents: String) {
	let datetime = new Date()
	let dir = `${__dirname.substring(0,__dirname.length-8)}/logs/sys.log`
	let msg = `${datetime.toISOString().slice(0,22)} -> ${logContents}`
	//exec(`echo ${datetime.toISOString().slice(0,22)} -> ${logContents} >> ${__dirname.substring(0,__dirname.length-8)}/logs/sys.log`)
	var stream = fs.createWriteStream(dir, {flags: 'a', autoClose: true})
	stream.write(msg + "\n")
	stream.end()
}