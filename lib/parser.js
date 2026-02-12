import fs from "fs";
import readline from "readline";
import { EOL } from "os";
import { formatColor, highlightEmoji } from "./utils.js";

const LANG_PATTERNS = {
  js: [
    /^(?<file>.*\.js):(?<line>\d+):(?<col>\d+)\s*-\s*(?<message>.*)$/,
    /at (?<function>[\w$.<>]+) \((?<file>.*\.js):(?<line>\d+):(?<col>\d+)\)/
  ],
  python: [
    /^  File "(?<file>.*\.py)", line (?<line>\d+), in (?<function>.*)$/,
    /^(?<message>[\w\s]+Error: .*|Traceback.*)$/
  ],
  java: [
    /at (?<function>[\w$.<>]+)\((?<file>.*\.java):(?<line>\d+)\)/,
    /^(?<message>Exception in thread ".*" .*|Caused by: .*)$/
  ],
  go: [
    /^(?<file>.*\.go):(?<line>\d+):(?<message>.*)$/,
    /^(?<function>[\w$.<>]+)\(\)/
  ]
};

function detectLanguage(line){
  if(line.includes(".js")) return "js";
  if(line.includes(".py")) return "python";
  if(line.includes(".java")) return "java";
  if(line.includes(".go")) return "go";
  return "unknown"
}

function parseLine(line){
  const lang=detectLanguage(line)
  const patterns=LANG_PATTERNS[lang]||[]
  let result={raw:line,language:lang}
  for(const pattern of patterns){
    const match=line.match(pattern)
    if(match?.groups){
      result={...result,...match.groups}
      break
    }
  }
  if(result.line) result.line=parseInt(result.line,10)
  if(!result.function) result.function="<anonymous>"
  if(!result.message&&result.raw) result.message=result.raw.trim()
  return result
}

export async function parseStream(stream,options={highlight:true}){
  const rl=readline.createInterface({input:stream,crlfDelay:Infinity})
  const parsedLines=[]
  for await(const line of rl){
    let parsed=parseLine(line)
    if(options.highlight){
      parsed.display=[formatColor(parsed.language,parsed.file||"<unknown file>"),highlightEmoji(parsed.language),parsed.function,parsed.line??"-",parsed.message].join(" | ")
    }
    parsedLines.push(parsed)
  }
  return parsedLines
}

export async function parseFile(filePath,options={highlight:true}){
  if(!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  const stream=fs.createReadStream(filePath,{encoding:"utf8"})
  return parseStream(stream,options)
}

export async function parseInput(input,options={highlight:true}){
  if(typeof input==="string"&&input.includes(EOL)){
    const lines=input.split(EOL)
    return Promise.all(lines.map(async line=>parseLine(line)))
  }else if(typeof input.pipe==="function"){
    return parseStream(input,options)
  }else{
    throw new TypeError("Unsupported input type for parser")
  }
}

export function normalizeStack(stack){
  return stack.map(line=>({
    file:line.file??"<unknown>",
    line:line.line??-1,
    function:line.function??"<anonymous>",
    message:line.message??"",
    raw:line.raw??"",
    language:line.language??"unknown"
  }))
}

export function filterErrors(stack,severityList=["high","critical"]){
  return stack.filter(line=>severityList.includes(line.severity))
}

export function printStack(stack){
  for(const line of stack){
    console.log(line.display??`${line.language} | ${line.file}:${line.line} | ${line.function} | ${line.message}`)
  }
}

export const META_ITEMS=[
  {id:"supply_pkg_tamper_detect",domain:"SupplyChainSecurity",severity:"critical",techniques:["checksum verification","signature validation","artifact provenance"],docs:["https://owasp.org/www-project-supply-chain-security/"]},
  {id:"supply_dependency_confusion",domain:"SupplyChainSecurity",severity:"high",techniques:["namespace isolation","lockfile validation"],docs:["https://blog.npmjs.org/post/626173644928634112/dependency-confusion-vulnerability"]},
  {id:"supply_signed_release_check",domain:"SupplyChainSecurity",severity:"high",techniques:["pgp signature","cosign"],docs:["https://sigstore.dev/"]},
  {id:"vuln_sql_injection_detect",domain:"Vulnerability",severity:"critical",techniques:["static analysis","runtime logging","ORM enforcement"],docs:["https://owasp.org/www-community/attacks/SQL_Injection"]},
  {id:"vuln_xss_multi_stage",domain:"Vulnerability",severity:"critical",techniques:["DOM sanitization","CSP enforcement"],docs:["https://owasp.org/www-community/attacks/xss/"]},
  {id:"quality_code_coverage_low",domain:"Quality",severity:"medium",techniques:["unit test coverage","integration reporting","mutation testing"],docs:["https://en.wikipedia.org/wiki/Code_coverage"]},
  {id:"quality_cyclomatic_complexity_high",domain:"Quality",severity:"medium",techniques:["static analysis","metrics computation"],docs:["https://en.wikipedia.org/wiki/Cyclomatic_complexity"]},
  {id:"maintenance_deprecated_dependency",domain:"Maintenance",severity:"high",techniques:["dependency scanning","API version check"],docs:["https://snyk.io/blog/keeping-your-dependencies-up-to-date/"]},
  {id:"maintenance_unmaintained_module",domain:"Maintenance",severity:"medium",techniques:["git activity analysis","repo health metrics"],docs:["https://opensource.guide/best-practices/"]},
  {id:"license_missing_or_invalid",domain:"LICENSE",severity:"critical",techniques:["license scan","SPDX compliance"],docs:["https://spdx.org/licenses/"]},
  {id:"license_mismatch_dependency",domain:"LICENSE",severity:"high",techniques:["dependency license resolution","compatibility enforcement"],docs:["https://choosealicense.com/"]}
]