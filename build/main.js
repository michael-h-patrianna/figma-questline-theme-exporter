var w=Object.defineProperty,re=Object.defineProperties,ie=Object.getOwnPropertyDescriptor,ae=Object.getOwnPropertyDescriptors,le=Object.getOwnPropertyNames,L=Object.getOwnPropertySymbols;var H=Object.prototype.hasOwnProperty,ue=Object.prototype.propertyIsEnumerable;var X=(e,o,t)=>o in e?w(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t,$=(e,o)=>{for(var t in o||(o={}))H.call(o,t)&&X(e,t,o[t]);if(L)for(var t of L(o))ue.call(o,t)&&X(e,t,o[t]);return e},Y=(e,o)=>re(e,ae(o));var y=(e,o)=>()=>(e&&(o=e(e=0)),o);var ce=(e,o)=>{for(var t in o)w(e,t,{get:o[t],enumerable:!0})},de=(e,o,t,c)=>{if(o&&typeof o=="object"||typeof o=="function")for(let d of le(o))!H.call(e,d)&&d!==t&&w(e,d,{get:()=>o[d],enumerable:!(c=ie(o,d))||c.enumerable});return e};var me=e=>de(w({},"__esModule",{value:!0}),e);function D(e,o){if(typeof __html__=="undefined")throw new Error("No UI defined");let t=`<div id="create-figma-plugin"></div><script>document.body.classList.add('theme-${figma.editorType}');const __FIGMA_COMMAND__='${typeof figma.command=="undefined"?"":figma.command}';const __SHOW_UI_DATA__=${JSON.stringify(typeof o=="undefined"?{}:o)};${__html__}</script>`;figma.showUI(t,Y($({},e),{themeColors:typeof e.themeColors=="undefined"?!0:e.themeColors}))}var W=y(()=>{});var V=y(()=>{W()});var b,P,M=y(()=>{"use strict";b="Questline:",P=/^[a-z0-9-]+$/});function j(e){return e.toLowerCase().trim().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}function z(e){return/\s{2,}/.test(e)}var J=y(()=>{"use strict"});var Q,Z=y(()=>{"use strict";Q={MISSING_BG:`\u274C Missing Background Layer

Your questline frame needs a layer named "BG" that contains the background image.

How to fix:
1. Add a frame named "BG" inside your questline
2. Place your background image in this frame`,TOO_FEW_QUESTS:`\u274C Not Enough Quests

You need at least 3 quests in your questline.

How to fix:
1. Add more quest instances to your questline
2. Make sure each quest has a unique name`,TOO_MANY_QUESTS:`\u274C Too Many Quests

You can have a maximum of 20 quests in your questline.

How to fix:
1. Remove some quest instances
2. Keep only the quests you need`,DUPLICATE_QUEST_KEY:`\u274C Duplicate Quest Names

Two or more quests have the same name.

How to fix:
1. Give each quest a unique name
2. Check the "questKey" property in each quest instance`,INVALID_QUEST_KEY:`\u274C Invalid Quest Name

Quest names can only contain lowercase letters, numbers, and hyphens.

How to fix:
1. Use only lowercase letters (a-z)
2. Use numbers (0-9)
3. Use hyphens (-) instead of spaces
4. Examples: "quest-1", "daily-challenge", "bonus-round"`,QUEST_KEY_DOUBLE_WHITESPACE:`\u274C Invalid Quest Name

Quest name contains double spaces.

How to fix:
1. Remove extra spaces from the quest name
2. Use single spaces or hyphens instead`,QUEST_KEY_OUT_OF_BOUNDS:`\u274C Quest Positioned Outside Frame

This quest is positioned outside the questline frame.

How to fix:
1. Move the quest inside the questline frame
2. Make sure the entire quest is visible within the frame`,QUEST_KEY_NOT_INSIDE_PARENT:`\u274C Quest Not Fully Inside Frame

This quest extends beyond the questline frame boundaries.

How to fix:
1. Resize or reposition the quest
2. Make sure it fits completely within the frame`,QUEST_KEY_AUTO_LAYOUT_ENABLED:`\u274C Auto Layout Must Be Disabled

This quest has auto layout enabled, which can cause positioning issues.

How to fix:
1. Select the quest instance
2. In the right panel, turn off "Auto Layout"
3. Use absolute positioning instead`,MISSING_DONE_VARIANT:`\u274C Missing Quest States

This quest component is missing required states.

How to fix:
1. Make sure your quest component has "locked", "closed", and "open" states
2. Check the component properties in Figma`,MISSING_QUEST_KEY:`\u274C Missing Quest Name

This quest doesn't have a name assigned.

How to fix:
1. Select the quest instance
2. In the right panel, find the "questKey" property
3. Enter a unique name for this quest`,IMAGE_EXPORT_FAILED:`\u274C Image Export Failed

One or more images couldn't be exported.

How to fix:
1. Make sure all images are properly placed in frames
2. Check that images are not corrupted
3. Try re-uploading the images in Figma`,VALIDATION_FAILED:`\u274C Validation Error

There's an issue with your questline structure.

How to fix:
1. Check that all quest names are unique
2. Make sure quest names follow the naming rules
3. Verify all quests are properly positioned`,UNKNOWN:`\u274C Unexpected Error

Something went wrong while processing your questline.

How to fix:
1. Try refreshing the plugin
2. Check that your Figma file is saved
3. Make sure you have the latest version of the plugin`}});function pe(e){return e.type==="GROUP"&&"componentProperties"in e&&typeof e.componentProperties=="object"}function v(e){return"fills"in e}function ge(e){try{let o="",t=e.byteLength;for(let c=0;c<t;c++)o+=String.fromCharCode(e[c]);return btoa(o)}catch(o){console.log("EXPORT DEBUG: btoa failed, trying alternative base64 encoding");let t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",c="",d=0;for(;d<e.length;){let h=e[d++],p=d<e.length?e[d++]:0,s=d<e.length?e[d++]:0,i=h>>2,m=(h&3)<<4|p>>4,f=(p&15)<<2|s>>6,S=s&63;c+=t[i]+t[m]+(d>e.length+1?"=":t[f])+(d>e.length?"=":t[S])}return c}}function F(e){return Array.isArray(e.fills)&&e.fills.find(o=>o.type==="IMAGE"&&!!o.imageHash)||null}function q(e){return"findAll"in e&&typeof e.findAll=="function"}function _(e){let o=[];return q(e)&&(o=e.findAll(t=>!v(t)||t.name!=="Image"?!1:(t.type==="FRAME"||t.type==="RECTANGLE"||t.type==="ELLIPSE"||t.type==="POLYGON"||t.type==="STAR"||t.type==="VECTOR"||t.type==="BOOLEAN_OPERATION"||t.type==="LINE")&&!!F(t))),o[0]||null}async function K(){var S,N;console.log("SCAN DEBUG: scanQuestline started");let e=figma.currentPage.selection;console.log("SCAN DEBUG: got selection",e.length,e.map(n=>n.name));let o=[],t;if(e.length===0)return o.push({code:"UNKNOWN",message:"Please select a questline frame to scan.",level:"error"}),console.log("SCAN DEBUG: no selection"),k(o);let c=e.filter(n=>n.type==="FRAME"&&n.name.trim().toLowerCase().startsWith(b.toLowerCase()));if(console.log("SCAN DEBUG: selectedQuestlines",c.length,c.map(n=>n.name)),c.length===1)t=c[0],console.log("SCAN DEBUG: using selected questline",t.name);else return c.length>1?(o.push({code:"UNKNOWN",message:"Multiple questline frames selected. Please select only one questline frame.",level:"error"}),console.log("SCAN DEBUG: multiple questline frames selected, aborting"),k(o)):(o.push({code:"UNKNOWN",message:'Selected node is not a questline frame. Please select a frame named "Questline: <name>".',level:"error"}),console.log("SCAN DEBUG: no questline frame selected"),k(o));console.log("SCAN DEBUG: questline root found",t.name);let d=j(t.name.replace(b,"")),h={width:t.width,height:t.height},p=t.findOne(n=>n.name.toLowerCase()==="bg"),s;p&&"exportAsync"in p&&(s=await x(p),s||(o.push({code:"IMAGE_EXPORT_FAILED",message:"Background image could not be exported. Please re-upload the image in Figma.",nodeId:p.id,level:"error"}),console.log("SCAN DEBUG: BG exportAsync failed"))),console.log("SCAN DEBUG: bg layer found?",!!p),console.log("SCAN DEBUG: root.children length",t.children.length);let i=[],m=new Set;console.log("SCAN DEBUG: Starting quest processing, root.children.length:",t.children.length);for(let n of t.children){console.log("SCAN DEBUG: child",n.name,n.type);let A=n.type==="INSTANCE"&&"componentProperties"in n||pe(n)&&"componentProperties"in n||n.type==="GROUP"&&Array.isArray(n.children)&&n.children.some(r=>r.type==="FRAME"&&r.name==="Image");if(console.log("SCAN DEBUG: isCandidate",A),!A)continue;let u="";if(n.type==="INSTANCE"&&"componentProperties"in n){for(let r of Object.keys(n.componentProperties))if(r.startsWith("questKey")){u=String(n.componentProperties[r].value);break}}else if(n.type==="GROUP"&&"componentProperties"in n){for(let r of Object.keys(n.componentProperties))if(r.startsWith("questKey")){u=String(n.componentProperties[r].value);break}}else if(n.type==="GROUP"&&Array.isArray(n.children)){let r=n.children.find(G=>G.type==="TEXT");r&&typeof r.characters=="string"&&(u=r.characters)}if(console.log("SCAN DEBUG: questKeyRaw",u),!u||u.trim()===""){o.push({code:"MISSING_QUEST_KEY",message:`Quest key is missing for node "${n.name}". Please add a questKey property.`,nodeId:n.id,level:"error"});continue}let a=u.trim();if(!P.test(a)){o.push({code:"INVALID_QUEST_KEY",message:`Invalid quest key "${a}". Must be lowercase, alphanumeric, with hyphens only.`,nodeId:n.id,level:"error"});continue}if(z(a)){o.push({code:"QUEST_KEY_DOUBLE_WHITESPACE",message:`Quest key "${a}" contains double whitespace.`,nodeId:n.id,level:"error"});continue}if(m.has(a)){o.push({code:"DUPLICATE_QUEST_KEY",message:`Duplicate quest key "${a}". Each quest must have a unique name.`,nodeId:n.id,level:"error"});continue}m.add(a);let l=null;if(n.type==="GROUP"&&Array.isArray(n.children)?(l=n.children.find(r=>v(r)&&r.name==="Image"&&!!F(r))||null,console.log("SCAN DEBUG: GROUP node children:",(S=n.children)==null?void 0:S.map(r=>({name:r.name,type:r.type,hasFills:v(r),hasImagePaint:!!F(r)})))):n.type==="INSTANCE"&&q(n)&&(l=_(n),console.log("SCAN DEBUG: INSTANCE node, findImageNode result:",l?l.name:"null")),console.log("SCAN DEBUG: imageNode",l?l.name:null,l?l.type:null),!l){console.log("SCAN DEBUG: No imageNode found for quest",a,"node:",n.name,"type:",n.type);continue}let g,I,E;console.log("SCAN DEBUG: about to export quest images for",u);try{if("exportAsync"in l){if(console.log("SCAN DEBUG: imageNode has exportAsync, attempting export"),n.type==="INSTANCE"&&"componentProperties"in n){let r=n,G=(N=r.componentProperties.State)==null?void 0:N.value;try{r.setProperties({State:"locked"}),await new Promise(T=>setTimeout(T,100));let U=null;q(r)&&(U=_(r)),U&&(g=await x(U),console.log("SCAN DEBUG: locked state export result for",u,":",g?"SUCCESS":"FAILED")),r.setProperties({State:"closed"}),await new Promise(T=>setTimeout(T,100));let C=null;q(r)&&(C=_(r)),C&&(I=await x(C),console.log("SCAN DEBUG: closed state export result for",u,":",I?"SUCCESS":"FAILED")),r.setProperties({State:"open"}),await new Promise(T=>setTimeout(T,100));let O=null;q(r)&&(O=_(r)),O?(E=await x(O),console.log("SCAN DEBUG: open state export result for",u,":",E?"SUCCESS":"FAILED")):(console.log("SCAN DEBUG: could not find image node in open state for",u),E=g),G&&r.setProperties({State:G})}catch(U){console.log("SCAN DEBUG: failed to export states for",u,U),g=await x(l),I=g,E=g}}else g=await x(l),I=g,E=g;g?console.log("SCAN DEBUG: quest",u,"exportAsync succeeded, lockedImgUrl length:",g.length,"doneImgUrl length:",E==null?void 0:E.length):(o.push({code:"IMAGE_EXPORT_FAILED",message:"Quest image could not be exported. Please re-upload the image in Figma.",nodeId:n.id,level:"error"}),console.log("SCAN DEBUG: quest",u,"exportAsync failed, skipping export"))}else o.push({code:"IMAGE_EXPORT_FAILED",message:"Quest image node does not support export. Please use a Frame or Rectangle.",nodeId:n.id,level:"error"}),console.log("SCAN DEBUG: quest",u,"image node does not support exportAsync");console.log("SCAN DEBUG: finished quest image export",u)}catch(r){console.log("EXPORT DEBUG: quest",u,"image export error",r)}i.push({nodeId:n.id,questKey:a,x:l.x+n.x,y:l.y+n.y,w:l.width,h:l.height,rotation:l.rotation||0,lockedNodeId:l.id,closedNodeId:l.id,doneNodeId:l.id,lockedImgUrl:g,closedImgUrl:I,doneImgUrl:E}),console.log("SCAN DEBUG: quest added, total now",i.length),console.log("SCAN DEBUG: Added quest:",{questKey:a,nodeId:n.id,x:l.x+n.x,y:l.y+n.y})}console.log("SCAN DEBUG: Final quest count:",i.length),console.log("SCAN DEBUG: All quests:",i.map(n=>({questKey:n.questKey,nodeId:n.nodeId}))),i.length<3&&o.push({code:"TOO_FEW_QUESTS",message:Q.TOO_FEW_QUESTS,nodeId:t.id,level:"error"}),i.length>20&&o.push({code:"TOO_MANY_QUESTS",message:Q.TOO_MANY_QUESTS,nodeId:t.id,level:"error"});let f={questlineId:d,frameSize:h,backgroundNodeId:p?p.id:"",backgroundFillUrl:s,quests:i,issues:o};return console.log("SCAN DEBUG: returning scan result",f),f}function k(e){return{questlineId:"",frameSize:{width:0,height:0},backgroundNodeId:"",quests:[],issues:e}}async function x(e){if(console.log("EXPORT DEBUG: safeExportNodeAsPng called for",e.name,"type:",e.type),!("exportAsync"in e)){console.log("EXPORT DEBUG: node does not have exportAsync");return}try{console.log("EXPORT DEBUG: calling exportAsync on",e.name);let o=await e.exportAsync({format:"PNG"});console.log("EXPORT DEBUG: exportAsync succeeded for",e.name,"bytes:",o.length);let t=`data:image/png;base64,${ge(o)}`;return console.log("EXPORT DEBUG: base64 conversion successful, result length:",t.length),t}catch(o){console.log("EXPORT DEBUG: exportAsync failed for",e.name,o);return}}var ee=y(()=>{"use strict";M();J();Z()});async function oe(e){var h,p;console.log("EXPORT DEBUG: exportQuestline called with scan:",e);let o=[];if(e.issues.some(s=>s.level==="error"))return console.log("EXPORT DEBUG: Scan has errors, returning early"),{json:null,issues:e.issues};try{if(!P.test(e.questlineId))throw new Error("Invalid questlineId format");if(e.quests.length<3)throw new Error(`At least ${3} quests required`);if(e.quests.length>20)throw new Error(`No more than ${20} quests allowed`);let s=e.quests.map(m=>m.questKey.trim().toLowerCase());if(new Set(s).size!==s.length)throw new Error("Quest keys must be unique (case-insensitive, trimmed)");for(let m of e.quests){if(!P.test(m.questKey))throw new Error(`Invalid questKey format: ${m.questKey}`);if(/\s{2,}/.test(m.questKey))throw new Error(`Quest key cannot have double whitespace: ${m.questKey}`)}}catch(s){return o.push({code:"VALIDATION_FAILED",message:`Validation failed: ${s instanceof Error?s.message:"Unknown validation error"}`,level:"error"}),{json:null,issues:o}}let t=[];try{console.log("EXPORT DEBUG: Exporting background image...");let s=figma.getNodeById(e.backgroundNodeId);if(!s)throw new Error("Background node not found");let i=await s.exportAsync({format:"PNG"});console.log("EXPORT DEBUG: Background image exported, size:",i.length),t.push({name:"questline-bg.png",data:i})}catch(s){return console.log("EXPORT DEBUG: Background export failed:",s),o.push({code:"IMAGE_EXPORT_FAILED",message:`Background image could not be exported: ${s instanceof Error?s.message:"Unknown error"}`,level:"error"}),{json:null,issues:o}}let c=[];for(let s of e.quests){try{let i=figma.getNodeById(s.nodeId);if(!i||i.type!=="INSTANCE")throw new Error("Quest instance not found");let m=(p=(h=i.componentProperties)==null?void 0:h.State)==null?void 0:p.value;i.setProperties({State:"locked"}),await new Promise(a=>setTimeout(a,100));let f=null;if("findAll"in i&&(f=i.findOne(a=>a.type==="FRAME"&&a.name==="Image")),!f||!("exportAsync"in f))throw new Error("Image frame not found for locked state");let S=await f.exportAsync({format:"PNG"});console.log("EXPORT DEBUG: Quest locked image exported for",s.questKey,"size:",S.length),t.push({name:`quest-${s.questKey}-locked.png`,data:S}),i.setProperties({State:"closed"}),await new Promise(a=>setTimeout(a,100));let N=null;if("findAll"in i&&(N=i.findOne(a=>a.type==="FRAME"&&a.name==="Image")),!N||!("exportAsync"in N))throw new Error("Image frame not found for closed state");let n=await N.exportAsync({format:"PNG"});console.log("EXPORT DEBUG: Quest closed image exported for",s.questKey,"size:",n.length),t.push({name:`quest-${s.questKey}-closed.png`,data:n}),i.setProperties({State:"open"}),await new Promise(a=>setTimeout(a,100));let A=null;if("findAll"in i&&(A=i.findOne(a=>a.type==="FRAME"&&a.name==="Image")),!A||!("exportAsync"in A))throw new Error("Image frame not found for open state");let u=await A.exportAsync({format:"PNG"});console.log("EXPORT DEBUG: Quest done image exported for",s.questKey,"size:",u.length),t.push({name:`quest-${s.questKey}-done.png`,data:u}),m&&i.setProperties({State:m})}catch(i){return o.push({code:"IMAGE_EXPORT_FAILED",message:`Quest image export failed for ${s.questKey}: ${i instanceof Error?i.message:"Unknown error"}`,nodeId:s.nodeId,level:"error"}),{json:null,issues:o}}c.push({questKey:s.questKey,x:s.x,y:s.y,w:s.w,h:s.h,rotation:s.rotation,lockedImg:`quest-${s.questKey}-locked.png`,closedImg:`quest-${s.questKey}-closed.png`,doneImg:`quest-${s.questKey}-done.png`})}let d={questlineId:e.questlineId,frameSize:e.frameSize,background:{exportUrl:"questline-bg.png"},quests:c};return console.log("EXPORT DEBUG: Sending",t.length,"images + JSON for folder selection"),figma.ui.postMessage({type:"EXPORT_WITH_FOLDER",questlineId:e.questlineId,images:t,json:d}),{json:d,issues:o}}var te=y(()=>{"use strict";M()});var ne={};ce(ne,{default:()=>fe});function fe(){D({height:700,width:1100}),figma.ui.onmessage=async e=>{if(e.type==="SCAN"){figma.ui.postMessage({type:"SCAN_PROGRESS",progress:10});let o=await K();figma.ui.postMessage({type:"SCAN_PROGRESS",progress:100}),figma.ui.postMessage({type:"SCAN_RESULT",data:o})}else if(e.type==="EXPORT"){console.log("EXPORT DEBUG: Starting export...");try{let o;if(e.scan?(o=e.scan,console.log("EXPORT DEBUG: Using existing scan result")):(console.log("EXPORT DEBUG: No scan provided, scanning..."),o=await K()),console.log("EXPORT DEBUG: Scan result:",o),o.issues.some(c=>c.level==="error")){console.log("EXPORT DEBUG: Scan has errors, aborting export"),figma.ui.postMessage({type:"EXPORT_RESULT",data:{json:null,issues:o.issues}});return}console.log("EXPORT DEBUG: Calling exportQuestline...");let t=await oe(o);console.log("EXPORT DEBUG: Export result:",t),figma.ui.postMessage({type:"EXPORT_RESULT",data:t})}catch(o){console.log("EXPORT DEBUG: Export failed with error:",o),figma.ui.postMessage({type:"EXPORT_RESULT",data:{json:null,issues:[{code:"UNKNOWN",message:`Export failed: ${o instanceof Error?o.message:"Unknown error"}`,level:"error"}]}})}}else e.type==="RESIZE"&&figma.ui.resize(e.width,e.height)}}var se=y(()=>{"use strict";V();ee();te()});var Ee={"src/main/index.ts--default":(se(),me(ne)).default},ye="src/main/index.ts--default";Ee[ye]();
