import fs from "fs";
import { EOL } from "os";
import { formatColor, highlightEmoji } from "./utils.js";

const HISTORY_FILE=".stackly_history.json";

function loadHistory(){
  if(!fs.existsSync(HISTORY_FILE)) return []
  try{
    const raw=fs.readFileSync(HISTORY_FILE,"utf8")
    return JSON.parse(raw)
  }catch{
    return []
  }
}

function saveHistory(data){
  try{
    fs.writeFileSync(HISTORY_FILE,JSON.stringify(data,null,2),"utf8")
  }catch{}
}

export function checkHistory(message){
  const history=loadHistory()
  const record=history.find(e=>e.message===message)
  return record?true:false
}

export function updateHistory(error){
  const history=loadHistory()
  const timestamp=new Date().toISOString()
  const idx=history.findIndex(e=>e.message===error.message)
  if(idx>=0){
    history[idx].count=(history[idx].count||1)+1
    history[idx].lastSeen=timestamp
    if(error.fix) history[idx].lastFix=error.fix
    if(error.severity) history[idx].severity=error.severity
  }else{
    history.push({...error,count:1,firstSeen:timestamp,lastSeen:timestamp})
  }
  saveHistory(history)
}

export function getHistory(){
  return loadHistory()
}

export function recurringSummary(){
  const history=loadHistory()
  const summary={}
  for(const record of history){
    const key=record.message
    if(!summary[key]) summary[key]={count:0,severity:record.severity,lastSeen:record.lastSeen,firstSeen:record.firstSeen,lastFix:record.lastFix}
    summary[key].count+=record.count||1
  }
  return summary
}

export function printHistory(){
  const history=loadHistory()
  for(const record of history){
    console.log([
      formatColor(record.language||"<unknown>",record.file||"<unknown file>"),
      highlightEmoji(record.language),
      record.function||"<anonymous>",
      record.line??"-",
      record.message,
      `Severity:${record.severity||"unknown"}`,
      `Count:${record.count||1}`,
      `Last Seen:${record.lastSeen}`,
      `Last Fix:${record.lastFix??"N/A"}`
    ].join(" | "))
  }
}