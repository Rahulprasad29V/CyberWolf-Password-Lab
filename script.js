const $=id=>document.getElementById(id);
const U='ABCDEFGHIJKLMNOPQRSTUVWXYZ', L='abcdefghijklmnopqrstuvwxyz', N='0123456789', S='!@#$%^&*()-_=+[]{}:,.?';
const words=["river","wolf","cyber","secure","orbit","shadow","forest","rocket","matrix","signal","thunder","coffee","silver","pixel","guardian","dragon","falcon","network","castle","quantum","crystal","neon","tiger","storm","binary","phoenix","server","vortex","moon","sun"];

function randomInt(max){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]-Math.floor(a[0]/max)*max}
function securePick(str){return str[randomInt(str.length)]}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function buildPassword(len=20,opts={upper:true,lower:true,numbers:true,symbols:true,ambiguous:false,noRepeat:false}){
  let sets=[]; if(opts.upper)sets.push(opts.ambiguous?U.replace(/[O]/g,''):U); if(opts.lower)sets.push(opts.ambiguous?L.replace(/[ol]/g,''):L); if(opts.numbers)sets.push(opts.ambiguous?N.replace(/[01]/g,''):N); if(opts.symbols)sets.push(S);
  if(!sets.length)throw Error("Select at least one character type.");
  let pool=sets.join(''); if(opts.noRepeat && len>new Set(pool).size)throw Error("No-repeat mode cannot exceed the available character set.");
  let out=sets.map(securePick), tries=0;
  while(out.length<len && tries++<10000){let c=securePick(pool);if(!opts.noRepeat||!out.includes(c))out.push(c)}
  return shuffle(out).join('');
}
function charsetFor(p){let c=0;if(/[A-Z]/.test(p))c+=26;if(/[a-z]/.test(p))c+=26;if(/[0-9]/.test(p))c+=10;if(/[^A-Za-z0-9]/.test(p))c+=32;return c}
function entropy(p){const c=charsetFor(p);return p?Math.log2(Math.max(1,c))*p.length:0}
function strength(p){const e=entropy(p);if(!p)return["—",0];if(e<28)return["VERY WEAK",15];if(e<45)return["WEAK",32];if(e<70)return["MEDIUM",55];if(e<100)return["STRONG",78];return["VERY STRONG",100]}
function setMeter(bar,pct){bar.style.width=pct+"%";bar.style.background=pct<35?"#ef3340":pct<60?"#efb341":pct<80?"#4fb3ff":"#28d17c"}
function analyzeUI(p,bar,text,entropyEl){const [s,pct]=strength(p);text.textContent=s;entropyEl.textContent=`Entropy: ${p?entropy(p).toFixed(1):"—"} bits`;setMeter(bar,pct)}

function generate(){
 try{
  const p=buildPassword(+$("length").value,{upper:$("upper").checked,lower:$("lower").checked,numbers:$("numbers").checked,symbols:$("symbols").checked,ambiguous:$("ambiguous").checked,noRepeat:$("noRepeat").checked});
  $("passwordOutput").value=p; analyzeUI(p,$("strengthBar"),$("strengthText"),$("entropyText")); $("generatorMessage").textContent="Generated locally with Web Crypto API.";
 }catch(e){$("generatorMessage").textContent=e.message}
}
$("length").addEventListener("input",()=>{$("lengthValue").textContent=$("length").value;generate()});
["upper","lower","numbers","symbols","ambiguous","noRepeat"].forEach(id=>$(id).addEventListener("change",generate));
$("generateBtn").onclick=generate;$("regenerateBtn").onclick=generate;
$("copyBtn").onclick=async()=>{if($("passwordOutput").value&&$("passwordOutput").value!=="Click Generate"){await navigator.clipboard.writeText($("passwordOutput").value);$("generatorMessage").textContent="Copied to clipboard. Clear your clipboard when finished."}}

function updateAnalyzer(){
 const p=$("analyzeInput").value, c=charsetFor(p), [s,pct]=strength(p);
 $("aLength").textContent=p.length;$("aCharset").textContent=c;$("aUpper").textContent=/[A-Z]/.test(p)?"✓":"—";$("aLower").textContent=/[a-z]/.test(p)?"✓":"—";$("aNumbers").textContent=/[0-9]/.test(p)?"✓":"—";$("aSymbols").textContent=/[^A-Za-z0-9]/.test(p)?"✓":"—";
 $("analyzeStrength").textContent=s;$("analyzeEntropy").textContent=`Entropy: ${p?entropy(p).toFixed(1):"—"} bits`;setMeter($("analyzeBar"),pct);
 const list=$("analysisList");list.innerHTML="";if(!p)return;
 const repeated=/(.)\1{2,}/.test(p), sequential=/(?:abc|bcd|cde|123|234|345|qwe|asd)/i.test(p), common=/^(password|password123|qwerty|admin|letmein|welcome)/i.test(p);
 const checks=[["Length",p.length>=14?"Good length":"Consider using 14+ characters",p.length>=14?"ok":"warn"],["Repeated characters",repeated?"Repeated sequence detected":"No obvious repeated sequence",repeated?"warn":"ok"],["Sequential patterns",sequential?"Sequential/common keyboard pattern detected":"No obvious sequential pattern",sequential?"warn":"ok"],["Common password pattern",common?"Common password pattern detected":"No obvious common-password prefix",common?"bad":"ok"]];
 checks.forEach(x=>{const d=document.createElement("div");d.className="analysis-item "+x[2];d.textContent=`${x[0]}: ${x[1]}`;list.appendChild(d)})
}
$("analyzeInput").addEventListener("input",updateAnalyzer);
$("toggleAnalyze").onclick=()=>{$("analyzeInput").type=$("analyzeInput").type==="password"?"text":"password"};

function phrase(){
 let arr=[];for(let i=0;i<+$("wordCount").value;i++){let w=securePick(words);if($("capitalize").checked)w=w[0].toUpperCase()+w.slice(1);arr.push(w)}
 let out=arr.join("-");if($("phraseNumbers").checked)out+=String(randomInt(90)+10);if($("phraseSymbols").checked)out+=securePick("!@#$%&*");
 $("phraseOutput").value=out;$("phraseMessage").textContent="Generated locally."; 
}
$("wordCount").addEventListener("input",()=>{$("wordCountValue").textContent=$("wordCount").value});
$("phraseBtn").onclick=phrase;$("copyPhrase").onclick=async()=>{await navigator.clipboard.writeText($("phraseOutput").value);$("phraseMessage").textContent="Copied to clipboard."};

let bulk=[];
$("bulkBtn").onclick=()=>{
 try{const count=Math.min(500,Math.max(1,+$("bulkCount").value)),len=Math.min(128,Math.max(4,+$("bulkLength").value));bulk=[];const seen=new Set();while(bulk.length<count){const p=buildPassword(len);if(!seen.has(p)){seen.add(p);bulk.push(p)}}$("bulkOutput").value=bulk.join("\n");$("bulkMessage").textContent=`Generated ${bulk.length} unique passwords locally.`}
 catch(e){$("bulkMessage").textContent=e.message}
}
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$("downloadTxt").onclick=()=>bulk.length&&download("cyberwolf-passwords.txt",bulk.join("\n"),"text/plain");
$("downloadCsv").onclick=()=>bulk.length&&download("cyberwolf-passwords.csv","No,Password\n"+bulk.map((p,i)=>`${i+1},"${p.replaceAll('"','""')}"`).join("\n"),"text/csv");

function policy(){
 const rules=[];if($("pUpper").checked)rules.push("at least one uppercase letter");if($("pLower").checked)rules.push("at least one lowercase letter");if($("pNumber").checked)rules.push("at least one number");if($("pSymbol").checked)rules.push("at least one symbol");
 $("policyOutput").innerHTML=`<h3>Password Policy</h3><ul><li>Minimum password length: <b>${+$("policyLength").value}</b> characters.</li><li>Required composition: ${rules.length?rules.join(", "):"No specific character-class requirement"}.</li><li>Password history: prevent reuse of the previous <b>${+$("history").value}</b> passwords.</li><li>Password expiry: <b>${+$("expiry").value===0?"No scheduled expiry":$("expiry").value+" days"}</b>.</li><li>Multi-factor authentication: <b>${$("pMfa").checked?"Required":"Not mandated by this policy"}</b>.</li><li>Never store passwords in plaintext or transmit them unnecessarily.</li></ul>`;
}
["policyLength","history","expiry","pUpper","pLower","pNumber","pSymbol","pMfa"].forEach(id=>$(id).addEventListener("input",policy));
$("copyPolicy").onclick=async()=>{const temp=document.createElement("div");temp.innerHTML=$("policyOutput").innerHTML;await navigator.clipboard.writeText(temp.innerText);alert("Policy copied.");};

document.querySelectorAll(".nav").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));btn.classList.add("active");$(btn.dataset.section).classList.add("active")});
generate();phrase();policy();
