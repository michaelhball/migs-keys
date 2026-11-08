export function validMidiEvent(event, duration) {
  if (!event || !Number.isFinite(event.at) || event.at<0 || event.at>duration || !Array.isArray(event.data)) return false;
  const [status,...bytes]=event.data, kind=status>>4;
  return Number.isInteger(status) && status>=128 && status<=239 && event.data.length===([12,13].includes(kind)?2:3) && bytes.every(x=>Number.isInteger(x)&&x>=0&&x<=127);
}
export function encodeMidi(events,duration) {
  const variable = n => { const result=[n&127]; while((n>>>=7))result.unshift((n&127)|128);return result; };
  const word=n=>[n>>8&255,n&255], integer=n=>[n>>>24,n>>>16&255,n>>>8&255,n&255];
  // 1000 ticks / quarter, one second / quarter: one tick is one millisecond.
  const track=[0,255,81,3,15,66,64];let previous=0;
  for(const event of events) {const at=Math.round(event.at);track.push(...variable(at-previous),...event.data);previous=at;}
  track.push(...variable(Math.max(0,Math.round(duration)-previous)),255,47,0);
  return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,...word(1000),77,84,114,107,...integer(track.length),...track]);
}
