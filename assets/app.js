/* Kita · שפה כיתה ו׳ · app.js */
(function(){
"use strict";
var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v===null?d:v;}catch(e){return d;}},set:function(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}
function shuffleSeed(arr,seed){var a=arr.slice(),s=seed||1;for(var i=a.length-1;i>0;i--){s=(s*9301+49297)%233280;var j=Math.floor(s/233280*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function rnd(){return (Date.now()%997)+3;}
var EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;


/* teacher email from ?t= */
try{var t=new URLSearchParams(location.search).get("t"); if(t&&EMAIL.test(t)) LS.set("kitaSafaTeacher",t);}catch(e){}

/* ---------- persistent nav (state saved in localStorage) ---------- */
var NAVK="kitaSafa6:nav", navBtn=$("#nav-toggle");
function setNav(open,save){document.body.classList.toggle("nav-closed",!open);if(navBtn)navBtn.setAttribute("aria-expanded",open?"true":"false");if(save)LS.set(NAVK,open?"open":"closed");}
if(navBtn){var saved=LS.get(NAVK,"");setNav(saved?saved==="open":window.innerWidth>=760,false);
  navBtn.addEventListener("click",function(){setNav(document.body.classList.contains("nav-closed"),true);});}
var nav=$("#sitenav");if(nav){try{var sx=sessionStorage.getItem("kitaSafa6:navx");var row=$(".navrow.units",nav);if(row&&sx)row.scrollLeft=+sx;window.addEventListener("beforeunload",function(){try{sessionStorage.setItem("kitaSafa6:navx",row?row.scrollLeft:0);}catch(e){}});}catch(e){}}

/* ---------- TTS (he-IL) ---------- */
var TTS={supported:("speechSynthesis" in window)&&("SpeechSynthesisUtterance" in window),voice:null,queue:[],
  pick:function(){if(!TTS.supported)return null;var vs=speechSynthesis.getVoices()||[];for(var i=0;i<vs.length;i++){if(/^he|^iw/i.test(vs[i].lang))return vs[i];}return null;},
  stop:function(){if(!TTS.supported)return;TTS.queue=[];speechSynthesis.cancel();$$(".speaking").forEach(function(e){e.classList.remove("speaking");});},
  speak:function(blocks,rate){if(!TTS.supported)return false;TTS.stop();TTS.voice=TTS.pick();TTS.rate=rate||0.95;
    blocks.forEach(function(b){var txt=(b.innerText||b.textContent||"").replace(/\s+/g," ").trim();if(!txt)return;var parts=txt.match(/[^.!?:]+[.!?:״]*/g)||[txt];parts.forEach(function(p){p=p.trim();if(p)TTS.queue.push({el:b,text:p});});});
    TTS.next();return true;},
  next:function(){$$(".speaking").forEach(function(e){e.classList.remove("speaking");});var it=TTS.queue.shift();if(!it)return;it.el.classList.add("speaking");
    var u=new SpeechSynthesisUtterance(it.text);u.lang="he-IL";u.rate=TTS.rate||0.95;if(TTS.voice)u.voice=TTS.voice;u.onend=function(){TTS.next();};u.onerror=function(){TTS.next();};speechSynthesis.speak(u);}
};
window.KitaTTS=TTS;
if(TTS.supported&&speechSynthesis.onvoiceschanged!==undefined){speechSynthesis.onvoiceschanged=function(){TTS.voice=TTS.pick();};}
$$("[data-tts]").forEach(function(btn){
  btn.addEventListener("click",function(){
    var blocks=$$(btn.getAttribute("data-tts")); var note=btn.parentNode.querySelector(".tts-note");
    if(!TTS.supported){if(note)note.textContent="הדפדפן הזה לא תומך בהקראה. נסו Chrome, Edge או Safari.";return;}
    TTS.speak(blocks, btn.hasAttribute("data-slow")?0.75:0.95); btn.setAttribute("data-started","1");
    if(note) note.textContent=TTS.pick()?"מקריאים... אפשר לעצור בכל רגע.":"מקריאים. אם לא שומעים, ייתכן שאין במכשיר קול בעברית: אפשר להוסיף קול עברית בהגדרות המכשיר, או לנסות Chrome או Edge.";
  });
});
$$("[data-tts-stop]").forEach(function(b){b.addEventListener("click",function(){TTS.stop();});});
window.addEventListener("beforeunload",function(){TTS.stop();});

/* ---------- print: one section / cards only ---------- */
function bindPrint(root){
  $$("[data-print]",root).forEach(function(b){
    b.addEventListener("click",function(){
      var src=$(b.getAttribute("data-print")); if(!src) return;
      var old=$("#print-root"); if(old) old.remove();
      var pr=document.createElement("div"); pr.id="print-root"; pr.className="persec"; pr.appendChild(src.cloneNode(true));
      $$("button",pr).forEach(function(x){x.remove();});
      document.body.appendChild(pr); document.body.classList.add("printing-cards");
      setTimeout(function(){window.print();document.body.classList.remove("printing-cards");pr.remove();},80);
    });
  });
  $$("[data-print-cards]",root).forEach(function(b){
    b.addEventListener("click",function(){
      var src=$(b.getAttribute("data-print-cards")); if(!src) return;
      var old=$("#print-root"); if(old) old.remove();
      var pr=document.createElement("div"); pr.id="print-root"; pr.className="per"+(b.getAttribute("data-per")||"1");
      $$(".scard",src).forEach(function(c){pr.appendChild(c.cloneNode(true));});
      document.body.appendChild(pr); document.body.classList.add("printing-cards");
      setTimeout(function(){window.print();document.body.classList.remove("printing-cards");pr.remove();},80);
    });
  });
}
bindPrint(document);

/* ---------- lesson timer (7–10 / 30 / 5) ---------- */
$$("[data-timer]").forEach(function(box){
  var disp=$(".tdisp",box), left=420, iv=null, beep=null;
  function fmt(s){s=Math.max(0,s);return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2);}
  function draw(){disp.textContent=fmt(left);box.classList.toggle("low",left<=60&&left>0);box.classList.toggle("over",left<=0&&!!iv);}
  function run(){if(iv)clearInterval(iv);iv=setInterval(function(){left--;draw();if(left<=0){clearInterval(iv);iv=null;box.classList.add("over");disp.textContent="⏰ הזמן נגמר";}},1000);}
  $$("[data-t]",box).forEach(function(b){b.addEventListener("click",function(){left=+b.getAttribute("data-t");box.classList.remove("over");draw();run();});});
  $("[data-add]",box).addEventListener("click",function(){left+=+$("[data-add]",box).getAttribute("data-add");box.classList.remove("over");draw();if(!iv)run();});
  $("[data-pause]",box).addEventListener("click",function(){if(iv){clearInterval(iv);iv=null;}else if(left>0)run();});
  $("[data-reset]",box).addEventListener("click",function(){if(iv)clearInterval(iv);iv=null;left=420;box.classList.remove("over");draw();});
  draw();
});

/* ---------- lessons filter + search ---------- */
var lessonList=$("#lesson-list");
if(lessonList){
  var cards=$$(".lcard",lessonList), fu="all", fa="all";
  var input=$("#lesson-search"), count=$("#lesson-count"), empty=$("#no-results");
  function norm(s){return (s||"").toLowerCase().replace(/[\u0591-\u05C7]/g,"").replace(/["'״׳]/g,"");}
  function apply(){
    var q=norm(input?input.value:""), n=0;
    cards.forEach(function(c){
      var ok=(fu==="all"||c.getAttribute("data-u")===fu)&&(fa==="all"||c.getAttribute("data-a").indexOf(","+fa+",")>-1)&&(!q||norm(c.getAttribute("data-search")).indexOf(q)>-1);
      c.classList.toggle("hidden",!ok); if(ok)n++;
    });
    $$(".ugroup",lessonList).forEach(function(g){g.classList.toggle("hidden",!$(".lcard:not(.hidden)",g));});
    if(count)count.textContent=n; if(empty)empty.hidden=n>0;
  }
  function setBtn(group,val){$$('[data-fgroup="'+group+'"] button').forEach(function(o){o.setAttribute("aria-pressed",o.getAttribute("data-v")===val?"true":"false");});}
  $$("[data-fgroup] button").forEach(function(b){
    b.addEventListener("click",function(){var g=b.parentNode.getAttribute("data-fgroup"),v=b.getAttribute("data-v");if(g==="u")fu=v;else fa=v;setBtn(g,v);apply();});
  });
  if(input)input.addEventListener("input",apply);
  try{var sp=new URLSearchParams(location.search);
    if(sp.get("u")){fu=sp.get("u");setBtn("u",fu);} if(sp.get("a")){fa=sp.get("a");setBtn("a",fa);} if(sp.get("q")&&input){input.value=sp.get("q");}
  }catch(e){}
  apply(); window.KitaFilter={apply:apply};
}

/* ---------- quizzes ---------- */
var PRAISE=["כל הכבוד! 🎉","מצוין! ⭐","נכון מאוד! 👏","יפה מאוד! 🌟","בדיוק! ✅"];
var LEARN=["כמעט! לומדים מזה:","לא נורא, ככה לומדים:","שווה לבדוק שוב:","טוב שניסיתם! הנה הסבר:"];
$$(".quiz[data-quiz]").forEach(function(box){
  var data;try{data=JSON.parse($("#"+box.getAttribute("data-quiz")).textContent);}catch(e){return;}
  var title=box.getAttribute("data-title")||"בוחן", answers=new Array(data.length), score=0, answered=0;
  var progWrap=document.createElement("div");progWrap.className="progress";progWrap.innerHTML="<span></span>";var prog=progWrap.firstChild;box.appendChild(progWrap);
  var list=document.createElement("ol");list.className="qlist";box.appendChild(list);
  data.forEach(function(q,qi){
    var d=document.createElement("li");d.className="q";d.setAttribute("data-q",qi);
    var order=shuffleSeed(q.o.map(function(_,i){return i;}),(qi+1)*7+data.length);
    var h='<p class="qtext">'+esc(q.q)+'</p><div class="opts">';
    order.forEach(function(oi,k){h+='<button type="button" class="opt" data-o="'+oi+'"><span class="key">'+"אבגד"[k]+'</span>'+esc(q.o[oi])+'</button>';});
    d.innerHTML=h+'</div><div class="fb" role="status" aria-live="polite"></div>';list.appendChild(d);
    $$(".opt",d).forEach(function(btn){btn.addEventListener("click",function(){
      var oi=+btn.getAttribute("data-o"),fb=$(".fb",d);
      $$(".opt",d).forEach(function(b){b.disabled=true;if(+b.getAttribute("data-o")===q.a)b.classList.add("correct");});
      answers[qi]=oi;answered++;
      if(oi===q.a){score++;fb.className="fb show ok";fb.innerHTML="<b>"+PRAISE[qi%5]+"</b> "+esc(q.e);}
      else{btn.classList.add("wrong");fb.className="fb show no";fb.innerHTML="<b>"+LEARN[qi%4]+"</b> התשובה הנכונה: <b>"+esc(q.o[q.a])+"</b>. "+esc(q.e);}
      prog.style.width=(answered/data.length*100)+"%"; if(answered===data.length)finish();
    });});
  });
  var sum=document.createElement("div");sum.className="summary";box.appendChild(sum);
  function finish(){
    var pct=Math.round(score/data.length*100),msg;
    if(pct===100)msg="וואו! ענית/ם נכון על הכול. 🏆";
    else if(pct>=70)msg="עבודה טובה מאוד! קראו את ההסברים לשאלות שהיו קשות, ואפשר לנסות שוב.";
    else if(pct>=40)msg="התחלה טובה! חזרו לטקסט (אפשר גם להאזין לו), קראו את ההסברים ונסו שוב.";
    else msg="זה בסדר לטעות, ככה לומדים! קראו שוב את הטקסט ונסו שוב. אנחנו בטוחים שתצליחו.";
    var te=LS.get("kitaSafaTeacher","");
    sum.innerHTML='<h3>סיכום: '+score+' מתוך '+data.length+'</h3><p>'+msg+'</p>'+
      '<h4>✉️ שליחת התוצאה למורה</h4><p class="hint">לוחצים על הכפתור, ותוכנת המייל נפתחת עם התוצאה מוכנה. בודקים ולוחצים ״שליחה״. שום מידע לא נשמר באתר.</p>'+
      '<p><label>המייל של המורה<br><input type="email" class="t-email" value="'+esc(te)+'" placeholder="teacher@example.com"></label></p>'+
      '<p><label>שם או כינוי (לא חובה)<br><input type="text" class="s-name" maxlength="40"></label></p>'+
      '<p><label>מה למדתי? מה היה קשה? (לא חובה)<br><textarea class="s-ref" maxlength="500"></textarea></label></p>'+
      '<p><a class="btn send-mail" href="#">✉️ פתיחת מייל למורה</a> <button type="button" class="btn ghost retry">🔄 לנסות שוב</button></p>'+
      '<p class="err mail-err" hidden>כדי לשלוח צריך לכתוב את המייל של המורה.</p>';
    sum.classList.add("show");
    $(".retry",sum).addEventListener("click",function(){location.reload();});
    $(".send-mail",sum).addEventListener("click",function(ev){
      var em=$(".t-email",sum).value.trim();
      if(!EMAIL.test(em)){ev.preventDefault();$(".mail-err",sum).hidden=false;return;}
      LS.set("kitaSafaTeacher",em);
      var name=$(".s-name",sum).value.trim(),ref=$(".s-ref",sum).value.trim();
      var lines=["שלום,","","התוצאה שלי ב"+title+":","ציון: "+score+" מתוך "+data.length+" ("+pct+"%)",""];
      data.forEach(function(q,qi){var ok=answers[qi]===q.a;lines.push((qi+1)+". "+(ok?"✓":"✗")+" "+q.q+(ok?"":" (התשובה הנכונה: "+q.o[q.a]+")"));});
      if(ref)lines.push("","מה למדתי / מה היה קשה:",ref);
      lines.push("","תודה!",name);
      this.href="mailto:"+encodeURIComponent(em)+"?subject="+encodeURIComponent("בוחן שפה: "+title+(name?" · "+name:""))+"&body="+encodeURIComponent(lines.join("\n"));
    });
  }
});

/* ---------- teacher gate ---------- */
var gate=$("#teacher-gate");
if(gate){
  var content=$("#teacher-content"),pw=$("#teacher-pw"),err=$("#teacher-err");
  var unlock=function(){
    content.innerHTML=decodeURIComponent(escape(atob($("#teacher-data").textContent.trim())));content.hidden=false;gate.hidden=true;
    try{sessionStorage.setItem("kitaSafa6TeacherOK","1");}catch(e){}
    var te=$("#teacher-email-set");
    if(te){te.value=LS.get("kitaSafaTeacher","");$("#teacher-email-save").addEventListener("click",function(){
      var v=te.value.trim(),out=$("#teacher-link");if(!EMAIL.test(v)){out.textContent="נא לכתוב כתובת מייל תקינה.";return;}
      LS.set("kitaSafaTeacher",v);var base=location.href.replace(/teacher\.html.*$/,"");
      out.innerHTML='הקישור לכיתה שלך (המייל ימולא אוטומטית בבחנים):<br><code>'+esc(base+"index.html?t="+encodeURIComponent(v))+'</code>';});}
    bindPrint(content);
    if(location.hash){var tg=document.getElementById(location.hash.slice(1));if(tg)setTimeout(function(){tg.scrollIntoView();},30);}
  };
  $("#teacher-form").addEventListener("submit",function(e){e.preventDefault();if(pw.value.trim()==="1010"){err.hidden=true;unlock();}else{err.hidden=false;pw.value="";pw.focus();}});
  try{if(sessionStorage.getItem("kitaSafa6TeacherOK")==="1")unlock();}catch(e){}
}

/* ---------- teacher-only boxes on public pages (same session flag as the teacher gate) ---------- */
$$("[data-teacher-only]").forEach(function(box){
  var ok=false;try{ok=sessionStorage.getItem("kitaSafa6TeacherOK")==="1";}catch(e){}
  var d=$(box.getAttribute("data-teacher-only"));if(!ok||!d)return;
  try{box.innerHTML=decodeURIComponent(escape(atob(d.textContent.trim())));box.hidden=false;}catch(e){}
});

/* ---------- games ---------- */
var gd=$("#games-data");
if(gd){
  var G=JSON.parse(gd.textContent), stage=$("#game-stage"), titleEl=$("#game-title"), instr=$("#game-instr"), timer=null;
  function show(id){
    if(timer){clearInterval(timer);timer=null;}
    var g=G[id]; if(!g){id=Object.keys(G)[0];g=G[id];}
    $$(".gtile").forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-game")===id?"true":"false");});
    titleEl.textContent=g.title; instr.textContent=g.instr; stage.innerHTML=""; stage.setAttribute("data-type",g.type);
    TYPES[g.type](g,stage);
    if(history.replaceState)history.replaceState(null,"","#"+id);
  }
  window.KitaGames={show:show};
  $$(".gtile").forEach(function(b){b.addEventListener("click",function(){show(b.getAttribute("data-game"));var top=$("#game-panel");if(top&&top.scrollIntoView)top.scrollIntoView({behavior:"smooth",block:"start"});});});
  function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
  function info(st){var p=el("p","ginfo");p.setAttribute("aria-live","polite");st.appendChild(p);return p;}
  function done(st,msg){var p=el("div","gdone",'<span class="star">★</span> '+msg+' <button type="button" class="btn ghost">🔄 שוב</button>');p.setAttribute("role","status");st.appendChild(p);$("button",p).addEventListener("click",function(){show(location.hash.slice(1));});}
  var TYPES={
  memory:function(g,st){
    var cards=[];g.pairs.forEach(function(p,i){cards.push({k:i,t:p[0]});cards.push({k:i,t:p[1]});});cards=shuffleSeed(cards,rnd());
    var grid=el("div","memory");st.appendChild(grid);var inf=info(st);var open=[],found=0,tries=0,lock=false;
    cards.forEach(function(c,i){var b=el("button","mcard",'<span class="face back">א</span><span class="face front">'+esc(c.t)+'</span>');b.type="button";b.setAttribute("aria-label","קלף "+(i+1));
      b.addEventListener("click",function(){if(lock||b.classList.contains("open"))return;b.classList.add("open");b.setAttribute("aria-label",c.t);open.push({b:b,c:c});
        if(open.length===2){tries++;lock=true;
          if(open[0].c.k===open[1].c.k){open.forEach(function(o){o.b.classList.add("done");});found++;open=[];lock=false;inf.textContent="מצאתם זוג! ("+found+"/"+g.pairs.length+")";if(found===g.pairs.length)done(st,"כל הכבוד! מצאתם את כל הזוגות ב-"+tries+" ניסיונות.");}
          else{inf.textContent="לא זוג. נסו לזכור איפה כל קלף.";setTimeout(function(){open.forEach(function(o){o.b.classList.remove("open");o.b.setAttribute("aria-label","קלף");});open=[];lock=false;},950);}
        }});grid.appendChild(b);});
  },
  fill:function(g,st){
    var items=shuffleSeed(g.items,rnd()),i=0,right=0;var card=el("div","fillcard");st.appendChild(card);var inf=info(st);
    function step(){if(i>=items.length){card.innerHTML="";done(st,"סיימתם! "+right+" מתוך "+items.length+" נכון.");return;}
      var it=items[i],correct=it[1][0];var parts=it[0].split("___");
      card.innerHTML='<p class="gcount">'+(i+1)+" / "+items.length+'</p><p class="sentence">'+esc(parts[0])+'<span class="slot">?</span>'+esc(parts[1]||"")+'</p><div class="chips"></div>';
      shuffleSeed(it[1],i+rnd()).forEach(function(o){var b=el("button","chip",esc(o));b.type="button";b.addEventListener("click",function(){
        var ok=o===correct;if(ok)right++;$(".slot",card).textContent=correct;$(".slot",card).className="slot "+(ok?"ok":"no");
        inf.textContent=ok?"נכון! ✓":"התשובה הנכונה: "+correct;$$(".chip",card).forEach(function(x){x.disabled=true;});setTimeout(function(){i++;inf.textContent="";step();},ok?800:1700);});$(".chips",card).appendChild(b);});}
    step();
  },
  sort:function(g,st){
    var items=shuffleSeed(g.items.map(function(it,i){return {t:it[0],b:it[1]};}),rnd());
    var tray=el("div","tray");st.appendChild(tray);var bins=el("div","bins b"+g.bins.length);st.appendChild(bins);var inf=info(st);var sel=null,placed=0,right=0;
    items.forEach(function(it){var b=el("button","tile",esc(it.t));b.type="button";it.el=b;b.addEventListener("click",function(){$$(".tile",tray).forEach(function(x){x.classList.remove("sel");});sel=it;b.classList.add("sel");inf.textContent="עכשיו בחרו את הקבוצה המתאימה.";});tray.appendChild(b);});
    g.bins.forEach(function(name,bi){var d=el("div","bin",'<h4>'+esc(name)+'</h4>');d.setAttribute("role","button");d.tabIndex=0;
      function drop(){if(!sel){inf.textContent="קודם בוחרים כרטיס.";return;}var ok=sel.b===bi;var s=el("span","placed "+(ok?"ok":"no"),esc(sel.t)+(ok?" ✓":" ✗"));d.appendChild(s);sel.el.remove();placed++;if(ok)right++;
        inf.textContent=ok?"נכון!":"לא בדיוק. זה שייך ל״"+g.bins[sel.b]+"״.";sel=null;if(placed===items.length)done(st,"סיימתם! "+right+" מתוך "+items.length+" במקום הנכון.");}
      d.addEventListener("click",drop);d.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();drop();}});bins.appendChild(d);});
  },
  root:function(g,st){
    var items=shuffleSeed(g.items,rnd()),i=0,right=0;var card=el("div","rootcard");st.appendChild(card);var inf=info(st);
    function step(){if(i>=items.length){card.innerHTML="";done(st,"סיימתם! מצאתם "+right+" שורשים מתוך "+items.length+".");return;}
      var w=items[i][0],root=items[i][1],picked=[];
      card.innerHTML='<p class="gcount">'+(i+1)+" / "+items.length+'</p><p class="bigword">'+esc(w)+'</p><div class="letters"></div><p class="rootline">השורש: <span class="rl">_ - _ - _</span></p><p><button type="button" class="btn chk">✔ בדיקה</button> <button type="button" class="btn ghost clr">ניקוי</button></p>';
      var L=$(".letters",card);
      w.split("").forEach(function(ch,idx){var b=el("button","ltile",esc(ch));b.type="button";b.addEventListener("click",function(){if(b.classList.contains("on")||picked.length>=3)return;b.classList.add("on");picked.push(ch);draw();});L.appendChild(b);});
      function fin(c){return ({"ך":"כ","ם":"מ","ן":"נ","ף":"פ","ץ":"צ"})[c]||c;}
      function draw(){var a=picked.slice();while(a.length<3)a.push("_");$(".rl",card).textContent=a.join(" - ");}
      $(".clr",card).addEventListener("click",function(){picked=[];$$(".ltile",card).forEach(function(x){x.classList.remove("on");});draw();});
      $(".chk",card).addEventListener("click",function(){var ans=picked.map(fin).join(""),ok=ans===root;if(ok)right++;
        inf.textContent=ok?"נכון! השורש הוא "+root.split("").join("-")+" ✓":"השורש של ״"+w+"״ הוא "+root.split("").join("-")+".";$$("button",card).forEach(function(x){x.disabled=true;});setTimeout(function(){i++;inf.textContent="";step();},ok?900:1900);});
    }
    step();
  },
  race:function(g,st){
    var items=shuffleSeed(g.items,rnd()),i=0,right=0,wrong=0,left=g.seconds||60;
    var bar=el("div","racebar",'<span class="clock">⏱ <b>'+left+'</b></span><span class="score">✓ <b class="r">0</b> · ✗ <b class="w">0</b></span>');st.appendChild(bar);
    var start=el("button","btn big","▶ מתחילים!");start.type="button";st.appendChild(start);var card=el("div","racecard");st.appendChild(card);var inf=info(st);
    function end(){if(timer){clearInterval(timer);timer=null;}card.innerHTML="";done(st,"נגמר הזמן! "+right+" נכון, "+wrong+" טעויות.");}
    function step(){if(i>=items.length){items=shuffleSeed(items,rnd());i=0;}var it=items[i];card.innerHTML='<p class="bigword">'+esc(it[0])+'</p><div class="chips"></div>';
      g.bins.forEach(function(name,bi){var b=el("button","chip",esc(name));b.type="button";b.addEventListener("click",function(){if(bi===it[1]){right++;inf.textContent="✓";}else{wrong++;inf.textContent="✗ "+it[0]+" – "+g.bins[it[1]];}$(".r",bar).textContent=right;$(".w",bar).textContent=wrong;i++;step();});$(".chips",card).appendChild(b);});}
    start.addEventListener("click",function(){start.remove();step();timer=setInterval(function(){left--;$(".clock b",bar).textContent=left;if(left<=0)end();},1000);});
  },
  build:function(g,st){
    var items=shuffleSeed(g.items,rnd()),i=0,right=0;var card=el("div","buildcard");st.appendChild(card);var inf=info(st);
    function step(){if(i>=items.length){card.innerHTML="";done(st,"סיימתם! בניתם נכון "+right+" משפטים מתוך "+items.length+".");return;}
      var parts=items[i],order=shuffleSeed(parts.map(function(_,k){return k;}),i+rnd());if(order.every(function(v,k){return v===k;}))order.reverse();var built=[];
      card.innerHTML='<p class="gcount">'+(i+1)+" / "+items.length+'</p><div class="line" aria-live="polite"></div><div class="chips"></div><p><button type="button" class="btn ghost clr">ניקוי</button></p>';
      order.forEach(function(k){var b=el("button","chip",esc(parts[k]));b.type="button";b.addEventListener("click",function(){b.disabled=true;built.push(k);var s=el("span","piece",esc(parts[k]));$(".line",card).appendChild(s);
        if(built.length===parts.length){var ok=built.every(function(v,x){return v===x;});if(ok)right++;$(".line",card).classList.add(ok?"ok":"no");inf.textContent=ok?"משפט נכון! ✓":"הסדר הנכון: "+parts.join(" ");setTimeout(function(){i++;inf.textContent="";step();},ok?1000:2400);}});$(".chips",card).appendChild(b);});
      $(".clr",card).addEventListener("click",function(){built=[];$(".line",card).innerHTML="";$$(".chip",card).forEach(function(x){x.disabled=false;});});
    }
    step();
  },
  scramble:function(g,st){
    var items=shuffleSeed(g.items,rnd()),i=0,right=0;var card=el("div","rootcard");st.appendChild(card);var inf=info(st);
    function step(){if(i>=items.length){card.innerHTML="";done(st,"סיימתם! פתרתם "+right+" מתוך "+items.length+".");return;}
      var w=items[i][0],letters=w.split(""),order=shuffleSeed(letters.map(function(_,k){return k;}),i+rnd());if(order.every(function(v,k){return v===k;}))order.reverse();var out="";
      card.innerHTML='<p class="gcount">'+(i+1)+" / "+items.length+'</p><p class="hint">רמז: '+esc(items[i][1])+'</p><p class="bigword ans">&nbsp;</p><div class="letters"></div><p><button type="button" class="btn ghost clr">ניקוי</button> <button type="button" class="btn ghost skip">דילוג</button></p>';
      function fix(s){return s.replace(/[ךםןףץ]/g,function(c){return {"ך":"כ","ם":"מ","ן":"נ","ף":"פ","ץ":"צ"}[c];});}
      order.forEach(function(k){var ch=fix(letters[k]);var b=el("button","ltile",esc(ch));b.type="button";b.addEventListener("click",function(){b.disabled=true;out+=ch;$(".ans",card).textContent=out;
        if(out.length===w.length){var ok=fix(out)===fix(w);if(ok)right++;$(".ans",card).textContent=w;$(".ans",card).classList.add(ok?"ok":"no");inf.textContent=ok?"נכון! ✓":"המילה היא: "+w;setTimeout(function(){i++;inf.textContent="";step();},ok?900:1900);}});$(".letters",card).appendChild(b);});
      $(".clr",card).addEventListener("click",function(){out="";$(".ans",card).innerHTML="&nbsp;";$$(".ltile",card).forEach(function(x){x.disabled=false;});});
      $(".skip",card).addEventListener("click",function(){inf.textContent="המילה הייתה: "+w;i++;setTimeout(function(){inf.textContent="";step();},1200);});
    }
    step();
  },
  mcq:function(g,st){
    var items=shuffleSeed(g.items,rnd()),i=0,right=0;var card=el("div","fillcard");st.appendChild(card);var inf=info(st);
    function step(){if(i>=items.length){card.innerHTML="";done(st,"סיימתם! "+right+" מתוך "+items.length+" נכון.");return;}
      var it=items[i],correct=it[1];card.innerHTML='<p class="gcount">'+(i+1)+" / "+items.length+'</p><p class="sentence">'+esc(it[0])+'</p><div class="chips"></div>';
      shuffleSeed(it.slice(1),i+rnd()).forEach(function(o){var b=el("button","chip",esc(o));b.type="button";b.addEventListener("click",function(){var ok=o===correct;if(ok)right++;b.classList.add(ok?"ok":"no");inf.textContent=ok?"נכון! ✓":"התשובה: "+correct;$$(".chip",card).forEach(function(x){x.disabled=true;});setTimeout(function(){i++;inf.textContent="";step();},ok?800:1700);});$(".chips",card).appendChild(b);});}
    step();
  },
  tf:function(g,st){
    var items=shuffleSeed(g.items,rnd()),i=0,right=0;var card=el("div","fillcard");st.appendChild(card);var inf=info(st);
    function step(){if(i>=items.length){card.innerHTML="";done(st,"סיימתם! "+right+" מתוך "+items.length+" נכון.");return;}
      var it=items[i];card.innerHTML='<p class="gcount">'+(i+1)+" / "+items.length+'</p><p class="sentence">'+esc(it[0])+'</p><div class="chips tf"><button type="button" class="chip t">✔ אמת</button><button type="button" class="chip f">✘ בדיון</button></div><p class="expl"></p>';
      $$(".chip",card).forEach(function(b){b.addEventListener("click",function(){var said=b.classList.contains("t"),ok=said===it[1];if(ok)right++;b.classList.add(ok?"ok":"no");$(".expl",card).textContent=it[2];inf.textContent=ok?"נכון! ✓":"לא בדיוק.";
        $$(".chip",card).forEach(function(x){x.disabled=true;});var nx=el("button","btn","הבא ←");nx.type="button";nx.addEventListener("click",function(){i++;inf.textContent="";step();});card.appendChild(nx);});});}
    step();
  }
  };
  show((location.hash||"").slice(1));
}

})();
