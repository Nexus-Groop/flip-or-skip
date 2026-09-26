const fs = require('fs');
const vm = require('vm');

class ClassList {
  constructor(){this.set=new Set();}
  toggle(x){this.set.has(x)?this.set.delete(x):this.set.add(x);}
  contains(x){return this.set.has(x);}
  add(x){this.set.add(x)}
  remove(x){this.set.delete(x)}
}
class FakeEl {
  constructor(id, tag='div'){this.id=id;this.tagName=tag.toUpperCase();this.value='';this.textContent='';this.hidden=false;this.dataset={};this.style={setProperty:(k,v)=>this.style[k]=v};this.listeners={};this.attributes={};this.classList=new ClassList();this.focus=()=>{};this.innerHTML='';}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
  dispatchEvent(ev){for(const fn of (this.listeners[ev.type]||[])) fn.call(this,ev);return true}
  click(){this.dispatchEvent(new Event('click',{bubbles:true}))}
  setAttribute(k,v){this.attributes[k]=String(v)}
  getAttribute(k){return this.attributes[k]}
  reset(){for(const id of ['buy','sale','shipping','other','customRate','customFixed']) elements[id].value=''; elements['marketplace'].value='ebay'; elements['target'].value='40';}
}
class FakeDocument {
  constructor(){
    this.elements={};
    const ids=['dealForm','buy','sale','shipping','other','marketplace','customRate','customFixed','customFeeWrap','target','targetOut','clearBtn','themeBtn','guideBtn','guide','closeGuide','guideBackdrop','dealHelp','feeHelp','verdictHelp','chartHelp','insightHelp','shareHelp','verdictBox','verdict','feeRate','profit','roi','margin','saleSummary','feeSummary','costSummary','profitBreak','insightFee','insightBreakEven','donut','donutCenter','shareBtn','emailBtn','textBtn','savePngBtn','shareStatus','selfTest'];
    for(const id of ids)this.elements[id]=new FakeEl(id,id==='dealForm'?'form':'div');
    for(const id of ['dealHelp','feeHelp','verdictHelp','chartHelp','insightHelp','shareHelp']) this.elements[id].hidden=true;
    this.elements.marketplace.tagName='SELECT'; this.elements.target.tagName='INPUT';
    for(const id of ['buy','sale','shipping','other','customRate','customFixed']) this.elements[id].tagName='INPUT';
    this.elements.clearBtn.tagName=this.elements.themeBtn.tagName=this.elements.guideBtn.tagName=this.elements.closeGuide.tagName=this.elements.guideBackdrop.tagName=this.elements.shareBtn.tagName=this.elements.emailBtn.tagName=this.elements.textBtn.tagName=this.elements.savePngBtn.tagName='BUTTON';
    this.helpButtons=['dealHelp','feeHelp','verdictHelp','chartHelp','insightHelp','shareHelp'].map(id=>{const b=new FakeEl(id+'Btn','button');b.dataset.help=id;b.attributes['data-help']=id;return b});
    this.documentElement={classList:new ClassList(),scrollWidth:390,style:{setProperty:(k,v)=>this.documentElement.style[k]=v,getPropertyValue:(k)=>this.documentElement.style[k]||''}};
    this.body={dataset:{},classList:new ClassList()};
  }
  getElementById(id){return this.elements[id]||null}
  querySelectorAll(sel){return sel==='[data-help]'?this.helpButtons:[]}
  querySelector(sel){if(sel==='[data-help="dealHelp"]') return this.helpButtons[0]; return null}
}
const document=new FakeDocument();
const elements=document.elements;
const local={store:{},getItem(k){return this.store[k]??null},setItem(k,v){this.store[k]=String(v)}};
const context={console,Intl,Number,Object,Math,parseFloat,URLSearchParams,document,localStorage:local,location:{search:'?selftest=1'},innerWidth:390,Event:class Event{constructor(type,opts){this.type=type;this.bubbles=!!opts?.bubbles}},window:null};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('../site/shared/calculator.js','utf8'),context);
vm.runInContext(fs.readFileSync('../site/shared/app.js','utf8'),context);
const report=elements.selfTest.innerHTML;
if(!report.includes('Browser self-test: 12/12 passed')){console.error(report);process.exit(1)}
console.log('PASS UI controller integration:', report.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,120));
