const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.lastIndexOf('(function(){');
const script=html.slice(start,html.indexOf('</script>',start)).replace('window.kindrichCurrencyCounterScan=scan;','window.kindrichCurrencyCounterScan=scan;window.testAnimate=animate;');
const frames=[],timers=[];
let reduced=false;
const context={page:'dashboard',company:'trading',projectId:null,Map,Number,String,Array,Math,document:{getElementById:()=>null,createElement:()=>({}),createTextNode:text=>({textContent:text}),head:{appendChild(){}},body:{},querySelectorAll:()=>[]},window:{matchMedia:()=>({matches:reduced})},MutationObserver:class{observe(){}},requestAnimationFrame:fn=>frames.push(fn),setTimeout:fn=>timers.push(fn)};
vm.runInNewContext(script,context);
function amount(text,label='Budget'){
  return {dataset:{},children:[],classList:{add(){}},isConnected:true,offsetHeight:20,strips:[],_text:text,
    closest(selector){if(selector.includes('hidden'))return null;if(selector==='.card')return {querySelector:()=>({textContent:label})};if(selector==='.detail-summary')return null;return {}},
    setAttribute(){},get textContent(){return this._text},set textContent(value){this._text=value;this.children=[];this.strips=[]},
    replaceChildren(...nodes){this.children=nodes;nodes.forEach(node=>node.parentNode=this)},
    set innerHTML(value){this.markup=value;this.children=[{}];this.strips=Array.from({length:(value.match(/class="rolling-digit-strip"/g)||[]).length},()=>({style:{},addEventListener(){}}))},
    querySelectorAll(){return this.strips},querySelector(){return this.strips[0]}
  };
}
const animate=context.window.testAnimate;
const initial=amount('₱7,500,000.00');animate(initial);
assert.equal(initial.markup,undefined,'First load must retain plain exact value');
initial.textContent='₱7,500,001.25';animate(initial);
const peso=initial.children[0];
frames.splice(0).forEach(fn=>fn(0));
frames.splice(0).forEach(fn=>fn(400));
assert.equal(initial.children[0],peso,'Peso text node must stay fixed');
assert.equal(initial.children[1].textContent,'7,500,001.09','Halfway value must follow cubic ease-out');
frames.splice(0).forEach(fn=>fn(800));
assert.equal(initial.textContent,'₱7,500,001.25','Finish must restore exact canonical text');
assert.equal(initial.children.length,0);
const decreasing=amount('₱999.99');animate(decreasing);frames.splice(0).forEach(fn=>fn(0));frames.splice(0).forEach(fn=>fn(800));assert.equal(decreasing.textContent,'₱999.99');
context.projectId='other-project';const other=amount('₱200.00');animate(other);assert.equal(other.markup,undefined,'Different projects must have independent counters');
const negative=amount('₱-3.50','Difference');animate(negative);negative.textContent='₱-9.75';animate(negative);frames.splice(0).forEach(fn=>fn(0));frames.splice(0).forEach(fn=>fn(800));assert.equal(negative.textContent,'₱-9.75');
reduced=true;negative.textContent='₱-2.25';animate(negative);assert.equal(negative.children.length,0,'Reduced motion retains static value');
console.log('Smooth currency checks passed: fixed peso, 800ms cubic ease-out, final text, decreases, project isolation, negative decimals, reduced motion.');
