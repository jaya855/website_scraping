//node project_cricinfo_scrap.js --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results" --dest=finalexcel.csv --resultfolder=finalresult
let minimist=require("minimist");
let args=minimist(process.argv);
let axios=require("axios");
let jsdom=require("jsdom");
let fs=require("fs");
let excel=require("excel4node");
let path=require("path");
let pdf=require("pdf-lib");

let promisetodwnld=axios.get(args.source);
promisetodwnld.then(function(response){
    let html=response.data;
    let dom=new jsdom.JSDOM(html);
    let document=dom.window.document;
    let matches=[];
    let matchScoreDivs=document.querySelectorAll("div.match-score-block");
    for(let i=0;i<matchScoreDivs.length;i++){
        let match={

        };

       let namePs= matchScoreDivs[i].querySelectorAll("p.name");
      match.t1=namePs[0].textContent;
      match.t2 =namePs[1].textContent;
     let scoreSpans= matchScoreDivs[i].querySelectorAll("div.score-detail>span.score");

if(scoreSpans.length==2){
    match.t1s=scoreSpans[0].textContent;
    match.t2s=scoreSpans[1].textContent;
}
else if(scoreSpans.length==1){
    match.t1s=scoreSpans[0].textContent;
    match.t2s="";

}
else{
    match.t1s="";
    match.t2s="";
}

     let spanResult=matchScoreDivs[i].querySelector("div.status-text>span");
     match.result=spanResult.textContent;
     matches.push(match);
    }
  //let filejson=JSON.stringify(matches);
  //fs.writeFileSync(args.dest,filejson,"utf-8");

   let teams=[];
for(let i=0;i<matches.length;i++){
fillteams(teams,matches[i]);
}

for(let i=0;i<matches.length;i++){
    fillmatches(teams,matches[i]);
    }


//let finaljson=JSON.stringify(teams);

//fs.writeFileSync(args.dest,finaljson,"utf-8");

createExcel(teams);
folders(teams);


}).catch(function(err){
    console.log(err);
})

function fillteams(teams,match){
    let t1idx=-1;
for(let i=0;i<teams.length;i++){
    
    if(match.t1==teams[i].name){
        t1idx=i;
        break;
    }
   
}
if(t1idx==-1){
teams.push({
    name:match.t1,
    matches:[]
})
}


let t2idx=-1;
for(let i=0;i<teams.length;i++){
    
    if(match.t2==teams[i].name){
        t2idx=i;
        break;
    }
   
}
if(t2idx==-1){
teams.push({
    name:match.t2,
    matches:[]
})
}

}

function fillmatches(teams,match){
    let t1idx=-1;
    for(let i=0;i<teams.length;i++){
        
        if(match.t1==teams[i].name){
            t1idx=i;
            break;
        }
       
    }

        let team1=teams[t1idx];
        team1.matches.push({
           vs:match.t2,
           selfscore:match.t1s,
           oppscore:match.t2s,
           result:match.result
        })


        

        let t2idx=-1;
    for(let i=0;i<teams.length;i++){
        
        if(match.t2==teams[i].name){
            t2idx=i;
            break;
        }
       
    }
    
        let team2=teams[t2idx]
        team2.matches.push({
           vs:match.t1,
           selfscore:match.t2s,
           oppscore:match.t1s,
           result:match.result
        })


        

}


function createExcel(teams){
    let wb=new excel.Workbook();
    for(let i=0;i<teams.length;i++){
      let sheet=  wb.addWorksheet(teams[i].name);
sheet.cell(1,1).string("VS");
sheet.cell(1,2).string("Self Score");
sheet.cell(1,3).string("Opp Score");
sheet.cell(1,4).string("Result");

for(let j=0;j<teams[i].matches.length;j++){
sheet.cell(j+2,1).string(teams[i].matches[j].vs);
sheet.cell(j+2,2).string(teams[i].matches[j].selfscore);
sheet.cell(j+2,3).string(teams[i].matches[j].oppscore);
sheet.cell(j+2,4).string(teams[i].matches[j].result);
    }
    
    }
    wb.write(args.dest);
};

function folders(teams){
    fs.mkdirSync(args.resultfolder);
    for(let i=0;i<teams.length;i++){
        let makefolder=path.join(args.resultfolder,teams[i].name);
        fs.mkdirSync(makefolder);
for(let j=0;j<teams[i].matches.length;j++){
    let filename=path.join(makefolder,teams[i].matches[j].vs +".pdf");
    createscorecard(teams[i].name,teams[i].matches[j],filename);

}

    }
}

function createscorecard(teamname,match,filename){
let t1=teamname;
let t2=match.vs;
let t1s=match.selfscore;
let t2s=match.oppscore;
let result=match.result;




let originalbytes=fs.readFileSync("worldcup2019template.pdf");
let promisetoload=pdf.PDFDocument.load(originalbytes);
promisetoload.then(function(pdfdoc){
let page=pdfdoc.getPage(0);

page.drawText(t1,{
x:320,
y:570,
size:10
});

page.drawText(t2,{
   x:320,
   y:553,
   size:10
});

page.drawText(t1s,{
   x:320,
   y:525,
   size:10
});

page.drawText(t2s,{
    x:320,
    y:500,
    size:10
 });

 page.drawText(result,{
    x:320,
    y:480,
    size:10
 });

let prmstosave=pdfdoc.save();
prmstosave.then(function(changedbytes){
   fs.writeFileSync(filename,changedbytes);
})

})
}