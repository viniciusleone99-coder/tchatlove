(()=>{'use strict';
const root=document.getElementById('portal-root');if(!root)return;
const words={fr:['Votre prochaine étape','Retrouvez votre progression et reprenez à votre rythme.','Ma progression'],it:['Il tuo prossimo passo','Ritrova i tuoi progressi e riprendi al tuo ritmo.','I miei progressi'],en:['Your next step','Review your progress and continue at your own pace.','My progress'],es:['Tu próximo paso','Consulta tus avances y continúa a tu ritmo.','Mi progreso'],de:['Dein nächster Schritt','Sieh dir deinen Fortschritt an und mach in deinem Tempo weiter.','Mein Fortschritt'],pt:['Seu próximo passo','Confira seu progresso e continue no seu ritmo.','Meu progresso']};
function language(){try{const l=localStorage.getItem('tl_navigation_language');return Object.hasOwn(words,l)?l:'fr'}catch{return 'fr'}}
function enhance(){const feature=root.querySelector('.page .feature');if(feature&&!root.querySelector('.tl4-quick')){const c=words[language()],section=document.createElement('section'),info=document.createElement('div'),title=document.createElement('strong'),body=document.createElement('p'),btn=document.createElement('button');section.className='tl4-quick';title.textContent=c[0];body.textContent=c[1];btn.textContent=c[2]+' →';btn.type='button';btn.className='btn secondary';btn.dataset.action='club-dashboard';info.append(title,body);section.append(info,btn);feature.before(section)}
const tools=document.querySelector('.tl4-utilities');if(tools){for(const b of [...document.body.children]){if(b.tagName==='BUTTON'&&b.style.position==='fixed'&&b.style.bottom==='6px')tools.append(b)}}
}
const tools=document.createElement('div');tools.className='tl4-utilities';document.body.append(tools);
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});new MutationObserver(schedule).observe(document.body,{childList:true});schedule();
})();