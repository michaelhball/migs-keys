
export function pianoPosition(exercise,index) {
  const event=exercise.events[index], total=exercise.events.length, elapsed=exercise.events.slice(0,index).reduce((sum,e)=>sum+(e.beats||1),0);
  const beat=event.beat ?? elapsed%4, fraction=beat-Math.floor(beat);
  const count=fraction===.5?`${Math.floor(beat)+1} &`:String(Number((beat+1).toFixed(2)));
  const bar=event.scoreBar ?? event.bar;
  return `${event.verse!==undefined?`Verse ${event.verse+1} · `:''}${bar===0?'Pickup':`Bar ${bar ?? Math.floor(elapsed/4)+1}`} · count ${count} · position ${index+1} of ${total}`;
}
export function pianoNavigation(exercise,index=0) {
  const bars=[...new Set(exercise.events.map((e,i)=>e.bar??Math.floor(i/4)+1))];
  return `<div class="piano-navigation"><div class="piano-step-buttons"><button class="button outline small" data-action="piano-step" data-delta="-1">← Previous</button><span id="piano-step-label">${pianoPosition(exercise,index)}</span><button class="button outline small" data-action="piano-step" data-delta="1">Next →</button></div><label class="piano-slider-label">Position<input type="range" id="piano-position" min="0" max="${exercise.events.length-1}" value="${index}" step="1"></label>${exercise.timeline?`<label>Go to bar<select id="piano-bar">${bars.map(bar=>`<option value="${bar}">${bar===0?'Pickup':bar}</option>`).join('')}</select>`:''}<p class="fine">Step through without sound. Listen starts from the selected position. A highlighted key shows its suggested finger; a rest means release that hand.</p></div>`;
}
