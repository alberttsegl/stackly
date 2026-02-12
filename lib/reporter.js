import fs from "fs";
import { getHistory, recurringSummary } from "./history.js";
import { processFixes } from "./fixer.js";
import { formatColor, highlightEmoji } from "./utils.js";

export function generateJSONReport(){
  const history=getHistory()
  const summary=recurringSummary()
  const enriched=processFixes(history)
  const report={
    generatedAt:new Date().toISOString(),
    totalErrors:history.length,
    recurring:Object.keys(summary).length,
    errors:enriched.map(e=>({
      file:e.file||"<unknown file>",
      line:e.line??"-",
      function:e.function||"<anonymous>",
      message:e.message,
      severity:e.severity,
      recurring:e.count||1,
      suggestedFix:e.fix||"N/A",
      docs:e.docs||null,
      lastSeen:e.lastSeen,
      firstSeen:e.firstSeen
    }))
  }
  return report
}

export function saveJSONReport(filePath){
  const report=generateJSONReport()
  fs.writeFileSync(filePath,JSON.stringify(report,null,2),"utf8")
  return filePath
}

export function generateHTMLReport(){
  const history=getHistory()
  const summary=recurringSummary()
  const enriched=processFixes(history)
  let html=[]
  html.push(`<html><head><meta charset="UTF-8"><title>Stackly Report</title><style>
    body{font-family:Arial,sans-serif;background:#1e1e1e;color:#ddd;padding:1rem}
    table{width:100%;border-collapse:collapse;margin-top:1rem}
    th,td{border:1px solid #555;padding:0.5rem;text-align:left}
    th{background:#333}
    tr:nth-child(even){background:#2a2a2a}
  </style></head><body>`)
  html.push(`<h1>Stackly Report</h1>`)
  html.push(`<p>Generated At: ${new Date().toISOString()}</p>`)
  html.push(`<p>Total Errors: ${history.length}</p>`)
  html.push(`<p>Recurring Errors: ${Object.keys(summary).length}</p>`)
  html.push(`<table><thead><tr>
    <th>File</th><th>Line</th><th>Function</th><th>Message</th><th>Severity</th><th>Recurring</th><th>Suggested Fix</th><th>Docs</th><th>First Seen</th><th>Last Seen</th>
  </tr></thead><tbody>`)
  for(const e of enriched){
    html.push(`<tr>
      <td>${formatColor(e.language,e.file||"<unknown>")}</td>
      <td>${e.line??"-"}</td>
      <td>${e.function||"<anonymous>"}</td>
      <td>${highlightEmoji(e.language)} ${e.message}</td>
      <td>${e.severity}</td>
      <td>${e.count||1}</td>
      <td>${e.fix||"N/A"}</td>
      <td>${e.docs?`<a href="${e.docs}" target="_blank">Link</a>`:"N/A"}</td>
      <td>${e.firstSeen||"-"}</td>
      <td>${e.lastSeen||"-"}</td>
    </tr>`)
  }
  html.push(`</tbody></table></body></html>`)
  return html.join("\n")
}

export function saveHTMLReport(filePath){
  const html=generateHTMLReport()
  fs.writeFileSync(filePath,html,"utf8")
  return filePath
}

export function printSummaryCLI(){
  const history=getHistory()
  const summary=recurringSummary()
  console.log(`Total Errors: ${history.length}`)
  console.log(`Recurring Errors: ${Object.keys(summary).length}`)
  for(const [msg,data] of Object.entries(summary)){
    console.log(`${msg} | Count:${data.count} | Severity:${data.severity} | Last Seen:${data.lastSeen}`)
  }
}