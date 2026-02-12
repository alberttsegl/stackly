import fs from "fs";
import { EOL } from "os";

const COLORS={
  reset:"\x1b[0m",
  red:"\x1b[31m",
  green:"\x1b[32m",
  yellow:"\x1b[33m",
  blue:"\x1b[34m",
  magenta:"\x1b[35m",
  cyan:"\x1b[36m",
  white:"\x1b[37m",
  gray:"\x1b[90m"
}

const LANGUAGE_EMOJI={
  js:"🟨",
  ts:"🟦",
  python:"🐍",
  go:"🐹",
  java:"☕",
  cpp:"💻",
  c:"🔧",
  ruby:"💎",
  php:"🐘",
  default:"❓"
}

export function formatColor(language,text){
  const color=languageColor(language)
  return `${color}${text}${COLORS.reset}`
}

export function languageColor(language){
  switch(language){
    case"js":return COLORS.yellow
    case"ts":return COLORS.blue
    case"python":return COLORS.green
    case"go":return COLORS.cyan
    case"java":return COLORS.magenta
    case"cpp":return COLORS.red
    case"c":return COLORS.gray
    case"ruby":return COLORS.red
    case"php":return COLORS.magenta
    default:return COLORS.white
  }
}

export function highlightEmoji(language){
  return LANGUAGE_EMOJI[language]||LANGUAGE_EMOJI.default
}

export function formatStackTrace(stackLines,options={linePrefix:"",color:true}){
  return stackLines.map(line=>{
    const trimmed=line.trim()
    return options.color?`${formatColor("cpp",options.linePrefix)}${trimmed}`:`${options.linePrefix}${trimmed}`
  })
}

export function regexMatch(message,pattern){
  try{
    const regex=new RegExp(pattern)
    return regex.test(message)
  }catch{return false}
}

export function regexExtract(message,pattern){
  try{
    const regex=new RegExp(pattern)
    const match=message.match(regex)
    return match||[]
  }catch{return[]}
}

export function logToFile(message,filePath="./stackly.log"){
  try{
    const timestamp=new Date().toISOString()
    fs.appendFileSync(filePath,`[${timestamp}] ${message}${EOL}`,"utf8")
  }catch{}
}

export function startSpinner(text="Loading..."){
  const frames=["|","/","-","\\"]
  let i=0
  const interval=setInterval(()=>{
    process.stdout.write(`\r${frames[i%frames.length]} ${text}`)
    i++
  },100)
  return interval
}

export function stopSpinner(interval){
  if(interval) clearInterval(interval)
  process.stdout.write("\r")
}

export function padString(str,length,pad=" "){
  str=String(str)
  if(str.length>=length) return str
  return str+pad.repeat(length-str.length)
}

export function truncateString(str,length){
  str=String(str)
  if(str.length<=length) return str
  return str.slice(0,length-3)+"..."
}

export function mergeUniqueArray(arr1,arr2){
  return Array.from(new Set([...arr1,...arr2]))
}

export function deepClone(obj){
  return JSON.parse(JSON.stringify(obj))
}

export function safeParseJSON(jsonStr){
  try{return JSON.parse(jsonStr)}catch{return null}
}

export function currentTimestamp(){
  return new Date().toISOString()
}