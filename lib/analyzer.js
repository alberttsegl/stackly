import { META_ITEMS } from "./parser.js";
import { DEFAULT_PATTERNS } from "./patterns.js";
import { checkHistory, updateHistory } from "./history.js";
import { formatColor, highlightEmoji } from "./utils.js";

function matchPattern(error, patterns = DEFAULT_PATTERNS){
  for(const pattern of patterns){
    if(pattern.languages.includes(error.language)){
      const regex=new RegExp(pattern.pattern)
      if(regex.test(error.message)) return pattern
    }
  }
  return null
}

function determineSeverity(pattern,error){
  if(pattern?.severity) return pattern.severity
  if(error.message.toLowerCase().includes("critical")||error.message.toLowerCase().includes("panic")) return "critical"
  if(error.message.toLowerCase().includes("warning")||error.message.toLowerCase().includes("deprecated")) return "medium"
  return "low"
}

function inferCause(pattern,error){
  if(pattern?.description) return pattern.description
  if(error.message.toLowerCase().includes("null")) return "null reference or uninitialized object"
  if(error.message.toLowerCase().includes("undefined")) return "undefined variable or function"
  if(error.message.toLowerCase().includes("connection")) return "connection failed / unreachable service"
  return "unknown"
}

function enrichError(error,patterns=DEFAULT_PATTERNS){
  const matched=matchPattern(error,patterns)
  const severity=determineSeverity(matched,error)
  const cause=inferCause(matched,error)
  const docsKey=matched?.docsKey
  const recurring=checkHistory(error.message)
  const display=[formatColor(error.language,error.file||"<unknown file>"),highlightEmoji(error.language),error.function,error.line??"-",error.message,`Severity:${severity}`,`Cause:${cause}`,`Recurring:${recurring}`].join(" | ")
  return {...error,severity,cause,matched,docsKey,recurring,display}
}

export function analyzeErrors(errors,patterns=DEFAULT_PATTERNS){
  const analyzed=[]
  for(const error of errors){
    const enriched=enrichError(error,patterns)
    analyzed.push(enriched)
    if(enriched.recurring) updateHistory(enriched)
  }
  return analyzed
}

export function filterBySeverity(errors,levelList=["high","critical"]){
  return errors.filter(e=>levelList.includes(e.severity))
}

export function summarizeErrors(errors){
  const summary={}
  for(const err of errors){
    const key=err.matched?.id||err.message
    if(!summary[key]) summary[key]={count:0,severity:err.severity,cause:err.cause,docsKey:err.docsKey}
    summary[key].count++
  }
  return summary
}

export function topRecurring(errors,limit=5){
  const summary=summarizeErrors(errors)
  const sorted=Object.entries(summary).sort((a,b)=>b[1].count-a[1].count)
  return sorted.slice(0,limit).map(([id,data])=>({id,count:data.count,severity:data.severity,cause:data.cause,docsKey:data.docsKey}))
}

export function printAnalyzed(errors){
  for(const err of errors){
    console.log(err.display??`${err.language} | ${err.file}:${err.line} | ${err.function} | ${err.message} | Severity:${err.severity} | Cause:${err.cause}`)
  }
}

export function integrateMeta(errors){
  return errors.map(err=>{
    const meta=META_ITEMS.find(item=>item.domain.toLowerCase()===err.language?.toLowerCase()||item.id===err.matched?.id)
    if(meta) return {...err,meta}
    return err
  })
}