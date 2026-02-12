import fs from "fs";
import path from "path";

const DEFAULT_PATH=path.resolve("./data/default_patterns.json");
const CUSTOM_PATH=path.resolve("./data/custom_patterns.json");

function loadJSON(filePath){
  if(!fs.existsSync(filePath)) return []
  try{
    const raw=fs.readFileSync(filePath,"utf8")
    return JSON.parse(raw)
  }catch{
    return []
  }
}

export const DEFAULT_PATTERNS=loadJSON(DEFAULT_PATH)
export const CUSTOM_PATTERNS=loadJSON(CUSTOM_PATH)

export function allPatterns(){
  return [...DEFAULT_PATTERNS,...CUSTOM_PATTERNS]
}

export function matchPattern(error,patterns=null){
  const list=patterns||allPatterns()
  for(const pattern of list){
    if(pattern.languages.includes(error.language)){
      const regex=new RegExp(pattern.pattern)
      if(regex.test(error.message)) return pattern
    }
  }
  return null
}

export function filterByLanguage(language,patterns=null){
  const list=patterns||allPatterns()
  return list.filter(p=>p.languages.includes(language))
}

export function filterBySeverity(severity,patterns=null){
  const list=patterns||allPatterns()
  return list.filter(p=>p.severity===severity)
}

export function categorizeErrors(errors,patterns=null){
  const categorized={}
  const list=patterns||allPatterns()
  for(const error of errors){
    const matched=matchPattern(error,list)
    const key=matched?.id||"unknown"
    if(!categorized[key]) categorized[key]={errors:[],severity:matched?.severity||"low",language:matched?.languages||[error.language||"unknown"]}
    categorized[key].errors.push(error)
  }
  return categorized
}

export function getPatternInfo(patternId,patterns=null){
  const list=patterns||allPatterns()
  return list.find(p=>p.id===patternId)||null
}

export function mapErrorToPattern(errors,patterns=null){
  const list=patterns||allPatterns()
  return errors.map(e=>{
    const matched=matchPattern(e,list)
    return {...e,matched}
  })
}

export function summarizePatterns(patterns=null){
  const list=patterns||allPatterns()
  const summary={}
  for(const p of list){
    if(!summary[p.severity]) summary[p.severity]={count:0,patterns:[]}
    summary[p.severity].count++
    summary[p.severity].patterns.push(p.id)
  }
  return summary
}