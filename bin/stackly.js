#!/usr/bin/env node

import { program } from "commander";
import path from "path";
import { analyzeErrors } from "../lib/analyzer.js";
import { liveWatch, monitorMultiple, tailFile } from "../lib/watcher.js";
import { generateJSONReport, saveJSONReport, generateHTMLReport, saveHTMLReport, printSummaryCLI } from "../lib/reporter.js";
import { addPattern, allPatterns } from "../lib/patterns.js";
import { formatColor, highlightEmoji, startSpinner, stopSpinner, currentTimestamp } from "../lib/utils.js";
import fs from "fs";

program
  .name("stackly")
  .description("Terminal-powered stack trace analyzer & smart fixer")
  .version("0.1.0")
  .option("-v, --verbose", "Verbose output for debugging")
  .option("-l, --lang <language>", "Filter analysis by language");

program
  .command("analyze <file>")
  .description("Analyze stack trace from a log file")
  .action(async file=>{
    const spinner=startSpinner(`Analyzing ${file}...`);
    try{
      if(!fs.existsSync(file)) throw new Error(`File not found: ${file}`);
      await analyzeErrors(file,{verbose:program.opts().verbose,language:program.opts().lang});
    }catch(e){
      console.error(formatColor("red",e.message));
    }finally{
      stopSpinner(spinner);
    }
  });

program
  .command("watch")
  .description("Watch logs live")
  .option("-f, --file <file>", "Optional file to watch instead of stdin/pipe")
  .action(async opts=>{
    const spinner=startSpinner("Initializing live watch...");
    try{
      if(opts.file){
        await liveWatch(opts.file,{highlight:true,spinner:true});
      }else{
        await liveWatch(process.stdin,{highlight:true,spinner:true});
      }
    }catch(e){
      console.error(formatColor("red",e.message));
    }finally{
      stopSpinner(spinner);
    }
  });

program
  .command("tail <file>")
  .description("Tail a log file and watch live updates")
  .action(async file=>{
    const spinner=startSpinner(`Tailing ${file}...`);
    try{
      if(!fs.existsSync(file)) throw new Error(`File not found: ${file}`);
      await tailFile(file,{highlight:true,spinner:true});
    }catch(e){
      console.error(formatColor("red",e.message));
    }finally{
      stopSpinner(spinner);
    }
  });

program
  .command("report")
  .description("Generate report in HTML or JSON")
  .option("-f, --format <type>", "Format: html or json", "json")
  .option("-o, --output <file>", "Output file path")
  .action(opts=>{
    try{
      let output=null;
      if(opts.format==="json"){
        output=opts.output?saveJSONReport(opts.output):generateJSONReport();
      }else if(opts.format==="html"){
        output=opts.output?saveHTMLReport(opts.output):generateHTMLReport();
      }else{
        throw new Error("Invalid format. Choose 'html' or 'json'");
      }
      console.log(formatColor("green",`Report generated successfully: ${opts.output||"<stdout>"}`));
    }catch(e){
      console.error(formatColor("red",e.message));
    }
  });

program
  .command("add-pattern <keyword> <suggestion>")
  .description("Add a custom error pattern")
  .action((keyword,suggestion)=>{
    try{
      addPattern(keyword,suggestion);
      console.log(formatColor("green",`Pattern added: ${keyword} → ${suggestion}`));
    }catch(e){
      console.error(formatColor("red",e.message));
    }
  });

program
  .command("list-patterns")
  .description("List all loaded patterns")
  .action(()=>{
    const patterns=allPatterns();
    for(const p of patterns){
      console.log(`${formatColor("cyan",p.id)} | ${p.languages.join(",")} | Severity:${p.severity} | Docs:${p.docsKey||"N/A"}`);
    }
  });

program
  .command("summary")
  .description("Print CLI summary of recurring errors")
  .action(()=>{
    printSummaryCLI();
  });

program.parse(process.argv);