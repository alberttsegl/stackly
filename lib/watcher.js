import fs from "fs";
import { EOL } from "os";
import { parseStream, parseFile } from "./parser.js";
import { analyzeErrors, integrateMeta, printAnalyzed } from "./analyzer.js";
import { processFixes, printFixes, integrateMeta as metaFixer } from "./fixer.js";
import { updateHistory, checkHistory } from "./history.js";
import { formatColor, highlightEmoji, startSpinner, stopSpinner } from "./utils.js";

export async function watchFile(filePath,options={highlight:true}){
  if(!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  let stream=fs.createReadStream(filePath,{encoding:"utf8",flags:"r"})
  let buffer=""
  stream.on("data",chunk=>{
    buffer+=chunk
    let lines=buffer.split(EOL)
    buffer=lines.pop()
    processLines(lines,options)
  })
  stream.on("end",()=>{if(buffer)processLines([buffer],options)})
}

export async function watchStream(stream,options={highlight:true}){
  let buffer=""
  stream.on("data",chunk=>{
    buffer+=chunk.toString()
    let lines=buffer.split(EOL)
    buffer=lines.pop()
    processLines(lines,options)
  })
  stream.on("end",()=>{if(buffer)processLines([buffer],options)})
}

async function processLines(lines,options){
  const parsed=[]
  for(const line of lines) parsed.push(await parseStream({[Symbol.asyncIterator]:async function*(){yield line}},options))
  const flattened=parsed.flat()
  const analyzed=integrateMeta(analyzeErrors(flattened))
  const fixes=metaFixer(processFixes(analyzed))
  for(const fix of fixes){
    if(!checkHistory(fix.message)){
      console.log(formatColor(fix.language,fix.file||"<unknown file>"),highlightEmoji(fix.language),fix.function,fix.line??"-",fix.message,`Severity:${fix.severity}`,`Suggested Fix:${fix.fix}`)
      updateHistory(fix)
    }
  }
}

export async function liveWatch(input,options={highlight:true,spinner:true}){
  let spinner=null
  if(options.spinner) spinner=startSpinner("Watching logs...")
  if(typeof input==="string"&&fs.existsSync(input)) await watchFile(input,options)
  else if(typeof input.pipe==="function") await watchStream(input,options)
  if(spinner) stopSpinner(spinner)
}

export async function monitorMultiple(files,options={highlight:true,spinner:true}){
  for(const file of files) liveWatch(file,options)
}

export async function tailFile(filePath,options={highlight:true}){
  let stats=fs.statSync(filePath)
  let start=stats.size
  let stream=fs.createReadStream(filePath,{encoding:"utf8",start})
  watchStream(stream,options)
}