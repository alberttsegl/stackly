import { DEFAULT_PATTERNS } from "./patterns.js";
import { DOCS_LINKS } from "./docs_links.js";
import { updateHistory } from "./history.js";
import { formatColor, highlightEmoji } from "./utils.js";

function matchPattern(error,patterns=DEFAULT_PATTERNS){
  for(const pattern of patterns){
    if(pattern.languages.includes(error.language)){
      const regex=new RegExp(pattern.pattern)
      if(regex.test(error.message)) return pattern
    }
  }
  return null
}

function suggestFix(error,patterns=DEFAULT_PATTERNS){
  const matched=matchPattern(error,patterns)
  if(!matched) return {fix:"No suggested fix",docs:null}
  const docsLink=DOCS_LINKS[matched.docsKey]||null
  let fix="General fix not available"
  if(matched.id==="undefined_function") fix="Define the missing function or import correct module"
  else if(matched.id==="null_reference") fix="Check object initialization before access"
  else if(matched.id==="db_connection_error") fix="Verify DB credentials and connectivity"
  else if(matched.id==="vuln_sql_injection_detect") fix="Use parameterized queries or ORM prepared statements"
  else if(matched.id==="vuln_xss_multi_stage") fix="Sanitize inputs and apply CSP headers"
  else if(matched.id==="quality_code_coverage_low") fix="Add or extend unit/integration tests"
  else if(matched.id==="quality_cyclomatic_complexity_high") fix="Refactor function to reduce complexity"
  else if(matched.id==="maintenance_deprecated_dependency") fix="Upgrade dependency to supported version"
  else if(matched.id==="maintenance_unmaintained_module") fix="Replace or fork unmaintained module"
  else if(matched.id==="license_missing_or_invalid") fix="Add a proper SPDX-compliant LICENSE file"
  else if(matched.id==="license_mismatch_dependency") fix="Resolve conflicts or remove incompatible dependencies"
  return {fix,docs:docsLink,matched}
}

export function processFixes(errors,patterns=DEFAULT_PATTERNS){
  const fixes=[]
  for(const error of errors){
    const suggested=suggestFix(error,patterns)
    const priority=(error.recurring||error.severity==="critical"||error.severity==="high")?"high":"low"
    fixes.push({...error,...suggested,priority})
    updateHistory({...error,fix:suggested.fix})
  }
  return fixes
}

export function printFixes(fixes){
  for(const fix of fixes){
    console.log([
      formatColor(fix.language,fix.file||"<unknown file>"),
      highlightEmoji(fix.language),
      fix.function,
      fix.line??"-",
      fix.message,
      `Severity:${fix.severity}`,
      `Priority:${fix.priority}`,
      `Suggested Fix:${fix.fix}`,
      `Docs:${fix.docs??"N/A"}`
    ].join(" | "))
  }
}

export function topFixes(fixes,limit=5){
  const sorted=fixes.sort((a,b)=>b.priority.localeCompare(a.priority))
  return sorted.slice(0,limit)
}

export function integrateMeta(fixes,META_ITEMS){
  return fixes.map(f=>{
    const meta=META_ITEMS.find(m=>m.id===f.matched?.id||m.domain.toLowerCase()===f.language?.toLowerCase())
    if(meta) return {...f,meta}
    return f
  })
}