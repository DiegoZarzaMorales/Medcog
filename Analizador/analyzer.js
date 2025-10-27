// Standalone analyzer (lexer + parser) — open Analizador/analyzer.html
function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const tabEditor = document.getElementById('tabEditor');
const tabLexer  = document.getElementById('tabLexer');
const tabParser = document.getElementById('tabParser');
const tabGrammar= document.getElementById('tabGrammar');

const screenEditor = document.getElementById('screenEditor');
const screenLexer  = document.getElementById('screenLexer');
const screenParser = document.getElementById('screenParser');
const screenGrammar= document.getElementById('screenGrammar');

const sourceEditor = document.getElementById('sourceEditor');
const runLex = document.getElementById('runLex');
const runParse = document.getElementById('runParse');
const tokensTableBody = document.querySelector('#tokensTable tbody');
const treeArea = document.getElementById('treeArea');
const grammarEditor = document.getElementById('grammarEditor');
const saveGrammar = document.getElementById('saveGrammar');
const resetGrammar = document.getElementById('resetGrammar');
const fileInput = document.getElementById('fileInput');
const langMode = document.getElementById('langMode');
const loadExample = document.getElementById('loadExample');

function showScreen(name){
  [screenEditor, screenLexer, screenParser, screenGrammar].forEach(s=> s.hidden = true);
  [tabEditor, tabLexer, tabParser, tabGrammar].forEach(t=> t.classList.remove('active-tab'));
  if(name === 'editor'){ screenEditor.hidden=false; tabEditor.classList.add('active-tab'); sourceEditor.focus(); }
  if(name === 'lexer'){ screenLexer.hidden=false; tabLexer.classList.add('active-tab'); }
  if(name === 'parser'){ screenParser.hidden=false; tabParser.classList.add('active-tab'); }
  if(name === 'grammar'){ screenGrammar.hidden=false; tabGrammar.classList.add('active-tab'); }
}
tabEditor.addEventListener('click', ()=> showScreen('editor'));
tabLexer.addEventListener('click', ()=> showScreen('lexer'));
tabParser.addEventListener('click', ()=> showScreen('parser'));
tabGrammar.addEventListener('click', ()=> showScreen('grammar'));

fileInput?.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = () => sourceEditor.value = r.result;
  r.readAsText(f);
});

loadExample?.addEventListener('click', () => {
  const mode = langMode.value;
  if(mode === 'arithmetic') sourceEditor.value = '(3 + 4) * 2 == 14';
  else if(mode === 'assignment') sourceEditor.value = 'x = (a + 3) * 2;';
  else sourceEditor.value = '// ejemplo\nx = (b + 5) * 2;';
});

function tokenize(src){
  const tokens=[]; let i=0;
  const isLetter = c=>/[a-zA-Z_]/.test(c); const isDigit = c=>/[0-9]/.test(c);
  while(i<src.length){
    const ch = src[i];
    
    // Comentarios de línea //
    if(src.substr(i,2)==='//'){
      let j=i+2;
      while(j<src.length && src[j]!=='\n') j++;
      tokens.push({type:'COMMENT',lexeme:src.slice(i,j),pos:i});
      i=j;
      continue;
    }
    
    // Comentarios de bloque /* */
    if(src.substr(i,2)==='/*'){
      let j=i+2;
      while(j<src.length-1 && src.substr(j,2)!=='*/') j++;
      if(src.substr(j,2)==='*/') j+=2;
      tokens.push({type:'COMMENT',lexeme:src.slice(i,j),pos:i});
      i=j;
      continue;
    }
    
    if(/\s/.test(ch)){ i++; continue; }
    if(isLetter(ch)){ let j=i+1; while(j<src.length && /[a-zA-Z0-9_]/.test(src[j])) j++; tokens.push({type:'IDENT',lexeme:src.slice(i,j),pos:i}); i=j; continue; }
    if(isDigit(ch)){ let j=i+1; while(j<src.length && /[0-9\.]/.test(src[j])) j++; tokens.push({type:'NUMBER',lexeme:src.slice(i,j),pos:i}); i=j; continue; }
    const two = src.substr(i,2);
    if(['==','!=','<=','>=','&&','||'].includes(two)){ tokens.push({type:'OP',lexeme:two,pos:i}); i+=2; continue; }
    if('=+-*/%();,{}[]<>'.includes(ch)){ tokens.push({type:'SYM',lexeme:ch,pos:i}); i++; continue; }
    tokens.push({type:'UNKNOWN',lexeme:ch,pos:i}); i++;
  }
  return tokens;
}

function renderTokens(tokens){
  tokensTableBody.innerHTML='';
  tokens.forEach((t,idx)=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${idx+1}</td><td>${t.type}</td><td>${escapeHtml(t.lexeme)}</td><td>${t.pos}</td>`;
    tokensTableBody.appendChild(tr);
  });
}

if(runLex){
  runLex.addEventListener('click', ()=>{
    console.log('Botón léxico clickeado');
    const src = sourceEditor.value||'';
    const toks = tokenize(src);
    console.log('Tokens generados:', toks);
    renderTokens(toks);
    showScreen('lexer');
  });
} else {
  console.error('runLex button not found!');
}

function tokenizeForParser(src){
  const out=[]; let i=0; const isLetter=c=>/[a-zA-Z_]/.test(c); const isDigit=c=>/[0-9]/.test(c);
  while(i<src.length){
    const ch=src[i];
    
    // Ignorar comentarios de línea //
    if(src.substr(i,2)==='//'){ 
      while(i<src.length && src[i]!=='\n') i++; 
      continue; 
    }
    
    // Ignorar comentarios de bloque /* */
    if(src.substr(i,2)==='/*'){
      i+=2;
      while(i<src.length-1 && src.substr(i,2)!=='*/') i++;
      if(src.substr(i,2)==='*/') i+=2;
      continue;
    }
    
    if(/\s/.test(ch)){ i++; continue; }
    if(isLetter(ch)){ let j=i+1; while(j<src.length && /[a-zA-Z0-9_]/.test(src[j])) j++; out.push({type:'IDENT',value:src.slice(i,j)}); i=j; continue; }
    if(isDigit(ch)){ let j=i+1; while(j<src.length && /[0-9\.]/.test(src[j])) j++; out.push({type:'NUMBER',value:src.slice(i,j)}); i=j; continue; }
    if(src.substr(i,2)==='=='){ out.push({type:'OP',value:'=='}); i+=2; continue; }
    if('+-*/'.includes(ch)){ out.push({type:'OP',value:ch}); i++; continue; }
    if('=;(){}[],<>'.includes(ch)){ out.push({type:'SYM',value:ch}); i++; continue; }
    i++;
  }
  return out;
}

function parseSource(source, mode='arithmetic'){
  const tokens = tokenizeForParser(source); let pos=0;
  function peek(){ return tokens[pos]||null; } function consume(){ return tokens[pos++]||null; }
  function expect(type,val){ const t=peek(); if(!t||t.type!==type||(val!==undefined&&t.value!==val)) throw new Error(`se esperaba ${type}${val?(' '+val):''} en pos ${pos}`); return consume(); }

  function parseFactor(){ const t=peek(); if(!t) throw new Error('Factor inesperado EOF'); if(t.type==='NUMBER'){ consume(); return {type:'NumberLiteral',value:t.value}; } if(t.type==='IDENT'){ consume(); return {type:'Identifier',name:t.value}; } if(t.type==='SYM'&&t.value==='('){ consume(); const e=parseExpr(); expect('SYM',')'); return {type:'Paren',expr:e}; } throw new Error('Factor inválido cerca de '+JSON.stringify(t)); }
  function parseTerm(){ let node=parseFactor(); while(peek()&&peek().type==='OP'&&(peek().value==='*'||peek().value==='/')){ const op=consume().value; const right=parseFactor(); node={type:'BinaryExpression',operator:op,left:node,right}; } return node; }
  function parseExpr(){ let node=parseTerm(); while(peek()&&peek().type==='OP'&&(peek().value==='+'||peek().value==='-')){ const op=consume().value; const right=parseTerm(); node={type:'BinaryExpression',operator:op,left:node,right}; } if(peek()&&((peek().type==='OP'&&peek().value==='==')||(peek().type==='SYM'&&peek().value==='='))){ const op=consume().value; const right=parseExpr(); node={type:'BinaryExpression',operator:op,left:node,right}; } return node; }

  function parseAssignment(){ const id=expect('IDENT'); expect('SYM','='); const expr=parseExpr(); if(peek()&&peek().type==='SYM'&&peek().value===';') consume(); return {type:'Assignment',id:id.value,expr}; }
  function parseExpressionStmt(){ const expr=parseExpr(); if(peek()&&peek().type==='SYM'&&peek().value===';') consume(); return {type:'ExpressionStatement',expr}; }

  const body=[];
  if(mode==='assignment'){ while(pos<tokens.length){ if(peek() && peek().type==='IDENT' && tokens[pos+1] && tokens[pos+1].type==='SYM' && tokens[pos+1].value==='=') body.push(parseAssignment()); else body.push(parseExpressionStmt()); } }
  else { while(pos<tokens.length) body.push(parseExpressionStmt()); }
  return {type:'Program', body};
}

function createNodeElement(node){
  const el=document.createElement('div'); el.style.marginLeft='8px'; el.style.padding='4px 0';
  if(!node){ el.textContent='(empty)'; return el; }
  const title=document.createElement('div'); title.style.fontWeight='700';
  switch(node.type){
    case 'Program': title.textContent='Program'; el.appendChild(title); node.body.forEach(c=> el.appendChild(createNodeElement(c))); return el;
    case 'Assignment': title.textContent=`Assignment → ${node.id}`; el.appendChild(title); el.appendChild(createNodeElement(node.expr)); return el;
    case 'ExpressionStatement': title.textContent='ExpressionStatement'; el.appendChild(title); el.appendChild(createNodeElement(node.expr)); return el;
    case 'BinaryExpression': title.textContent=`Binary (${node.operator})`; el.appendChild(title); el.appendChild(createNodeElement(node.left)); el.appendChild(createNodeElement(node.right)); return el;
    case 'NumberLiteral': title.textContent=`Number: ${node.value}`; el.appendChild(title); return el;
    case 'Identifier': title.textContent=`Identifier: ${node.name}`; el.appendChild(title); return el;
    case 'Paren': title.textContent='Paren'; el.appendChild(title); el.appendChild(createNodeElement(node.expr)); return el;
    default: title.textContent=JSON.stringify(node); el.appendChild(title); return el;
  }
}

if(runParse){
  runParse.addEventListener('click', () => {
    console.log('Botón parser clickeado');
    const src = sourceEditor.value||'';
    const mode = langMode.value || 'arithmetic';
    console.log('Source:', src, 'Mode:', mode);
    treeArea.innerHTML='';
    try{
      const ast = parseSource(src, mode);
      console.log('AST generado:', ast);
      const treeElement = createNodeElement(ast);
      console.log('Elemento del árbol creado');
      treeArea.appendChild(treeElement);
      showScreen('parser');
    } catch(e){
      console.error('Error al parsear:', e);
      treeArea.innerHTML = `<div style="color:#b00000;font-weight:700;">Error al parsear: ${escapeHtml(String(e.message||e))}</div>`;
      showScreen('parser');
    }
  });
} else {
  console.error('runParse button not found!');
}

const defaultGrammar = `// Gramática de ejemplo (editable)
<program> ::= { <stmt> }
<stmt> ::= <ident> "=" <expr> ";" | <expr> ";"
<expr> ::= <term> { ("+"|"-") <term> }
<term> ::= <factor> { ("*"|"/") <factor> }
<factor> ::= NUMBER | IDENT | "(" <expr> ")"
`;

if(grammarEditor){
  grammarEditor.value = localStorage.getItem('analyzer_grammar') || defaultGrammar;
}

if(saveGrammar){
  saveGrammar.addEventListener('click', ()=> {
    localStorage.setItem('analyzer_grammar', grammarEditor.value);
    alert('Reglas guardadas.');
  });
}

if(resetGrammar){
  resetGrammar.addEventListener('click', ()=> {
    grammarEditor.value = defaultGrammar;
    localStorage.removeItem('analyzer_grammar');
    alert('Reglas restauradas.');
  });
}

console.log('Analizador inicializado correctamente');
console.log('Elementos DOM:', {
  runLex: !!runLex,
  runParse: !!runParse,
  treeArea: !!treeArea,
  sourceEditor: !!sourceEditor,
  langMode: !!langMode
});

showScreen('editor');