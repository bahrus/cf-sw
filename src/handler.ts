import { Declaration, CustomElementDeclaration, CustomElement, Package, ClassDeclaration, ClassField, ClassMethod } from '../../node_modules/custom-elements-manifest/schema.d.js';
import {EnhancedClassField} from '../../types';


export async function handleRequest(request: Request): Promise<Response> {
  const href = substr_between(request.url, 'href=', '&');
  const resp = await fetch(href);
  const json = await resp.json();
  const processed = getTagNameToDeclaration(json);
  
  return new Response(html`
    <html>
    <body>
    <script type=module>
      import 'https://cdn.skypack.dev/xtal-editor';
    </script>
    request method2: ${request.method}
    href: ${href}
    <xtal-editor>
    <textarea slot=initVal>
    ${JSON.stringify(processed)}
    </textarea>
    </xtal-editor>
    
    ${processed!.declarations.map(declaration => html`
        <h1>${(<any>declaration).tagName}</h1>
        ${tablify((<any>declaration).attributes, 'Attributes')}
        ${tablify((<any>declaration).cssProperties, 'CSS Properties')}
        ${tablify((<any>declaration).cssParts, 'CSS Parts')}
        ${tablify((<any>declaration).slots, 'Slots')}
        ${tablify((<any>declaration).events, 'Events')}
        ${tablify((<any>declaration).members.filter((x: any) => (x.kind === 'field') && (x.privacy !== 'private')) , 'Properties')}
        ${tablify((<any>declaration).members.filter((x: any) => (x.kind === 'method') && (x.privacy !== 'private')) , 'Methods')}
    `).join('')}
    </body>
    </html>
  `, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    }
  })
}

function tablify(obj: any[], name: string){
  if(obj === undefined || obj.length === 0) return '';

  const keys = getKeys(obj);
  const header = keys.map(x => html`<th>${x}</th>`).join('');
  const rows = obj.map(x => html`<tr>${keys.map(key => html`<td>${x[key]}</td>`).join('')}</tr>`).join('');
  return html`
  <h2>${name}</h2>
  <table>
    ${header}
    ${rows}
  </table>`;
}

function getKeys(obj: any[]){
  const keyCounts: {[key: string]: number} = {};
  for(const item of obj){
    for(const key of Object.keys(item)){
      if(keyCounts[key] === undefined) keyCounts[key] = 0;
      keyCounts[key]++;
    }
  }
  if(keyCounts['name'] !== undefined){
    keyCounts['name']++;
  }
  return Object.keys(keyCounts).sort((a,b) => keyCounts[b] - keyCounts[a]);

}

function html(strings: TemplateStringsArray, ...keys: string[]) {
  const out: string[]  = [];
  for (let i = 0, ii = strings.length; i < ii; i++) {
      out.push(strings[i]);
      // if we have a variables for it, we need to bind it.
      const ithKey = keys[i];
      if (ithKey !== undefined) {
        out.push(ithKey);
      }
    }
  return out.join('');
}

function getTagNameToDeclaration(fetchResult: any){
  const tagNameToDeclaration: {[key: string]: CustomElementDeclaration} = {};
  const pack = fetchResult as Package;
  if(pack === undefined) return;
  const mods = pack.modules;
  if(mods === undefined) tagNameToDeclaration;
  
  for(const mod of mods){
      const declarations = mod.declarations;
      if(declarations === undefined) continue;
      const tagDeclarations = declarations.filter(x => (x as CustomElement).tagName !== undefined);
      
      for(const declaration of tagDeclarations){
          const ce = declaration as CustomElementDeclaration;
          
          const tagName = (declaration as CustomElement).tagName!;
          
          
          if(tagName === undefined) continue;
          if(tagNameToDeclaration[tagName] !== undefined){
              if(countTypes(declaration) >  countTypes(tagNameToDeclaration[tagName] as Declaration)){
                  tagNameToDeclaration[tagName] = ce;
              }
          }else{
              tagNameToDeclaration[tagName] = ce;
          }
          (<any>ce).unevaluatedNonStaticPublicFields = getUnevaluatedNonStaticPublicFieldsFromDeclaration(ce);
          (<any>ce).methods = getMethodsFromDeclaration(ce);
      }

  }
  const declarations = Object.values(tagNameToDeclaration) as Declaration[];
  return {tagNameToDeclaration, declarations};  
}

function getFields(tagNameToDeclaration:  {[key: string]: CustomElementDeclaration}, tag: string){
  const ce = tagNameToDeclaration[tag!] as CustomElementDeclaration;
  const customElement = ce as unknown as CustomElement;
  if(ce === undefined || ce.members === undefined) return;
  const unevaluatedFields = getUnevaluatedNonStaticPublicFieldsFromDeclaration(ce);

  const fields = unevaluatedFields.map(field => {
      if(field.default !== undefined){
          let val = field.default;
          if(field.type !== undefined && field.type.text !== undefined){
              switch(field.type.text){
                  case 'boolean':
                  case 'number':
                      val = JSON.parse(val);
                      break;
                  case 'string':
                  case 'object':
                      try{
                          val = eval('(' + val + ')'); //yikes
                      }catch(e){
                        console.warn('Could not parse ' + val)
                      }
                      
                      break;
              }
          }
          return {
              ...field,
              val: val,
          };
      }else{
          return {
              ...field
          } as unknown as EnhancedClassField;
      }            
  });
  return {fields, customElement};
}

function getUnevaluatedNonStaticPublicFieldsFromDeclaration(ce: CustomElementDeclaration){
  if(ce === undefined || ce.members === undefined) return [];
  return ce.members.filter(x=> x.kind ==='field' && !x.static && !(x.privacy==='private')) as ClassField[];
}

function getMethodsFromDeclaration(ce: CustomElementDeclaration): ClassMethod[]{
  if(ce === undefined || ce.members === undefined) return [];
  return ce.members.filter(x => x.kind === 'method') as ClassMethod[];
}

function substr_between(str: string, start: string, end: string): string {
  const iPos = str.indexOf(end);
  return iPos === -1 ? str.substring(str.indexOf(start) + start.length) :  str.substring(str.indexOf(start) + start.length, iPos);
}

function countTypes(declaration: Declaration){
  let count = 0;
  if(declaration.kind !== 'class') return count;
  const classDeclaration = declaration as ClassDeclaration;
  if(classDeclaration.members === undefined) return count;
  for(const member of classDeclaration.members){
      const classField = member as ClassField;
      if(classField.type !== undefined) count++;
  }
  return count;
}