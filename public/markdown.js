export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function inline(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
export function markdown(text) {
  const lines = text.replace(/\r/g, '').split('\n'); let html = ''; let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const content = []; i++; while (i < lines.length && !lines[i].startsWith('```')) content.push(lines[i++]);
      html += `<pre>${escapeHtml(content.join('\n'))}</pre>`; i++; continue;
    }
    if (/^#{1,3} /.test(line)) { const level = Math.min(line.match(/^#+/)[0].length + 1, 4); html += `<h${level}>${inline(line.replace(/^#+ /, ''))}</h${level}>`; i++; continue; }
    if (line.startsWith('|') && lines[i + 1]?.match(/^\|[\s:|-]+\|$/)) {
      const cells = row => row.trim().slice(1, -1).split('|').map(x => x.trim());
      html += '<div class="table-scroll"><table><thead><tr>' + cells(line).map(x => `<th scope="col">${inline(x)}</th>`).join('') + '</tr></thead><tbody>'; i += 2;
      while (lines[i]?.startsWith('|')) { html += '<tr>' + cells(lines[i++]).map(x => `<td>${inline(x)}</td>`).join('') + '</tr>'; }
      html += '</tbody></table></div>'; continue;
    }
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const numbered = /^\d+\. /.test(line); const tag = numbered ? 'ol' : 'ul'; const pattern = numbered ? /^\d+\. / : /^[-*] /;
      const start = numbered ? Number(line.match(/^\d+/)[0]) : 1;
      html += `<${tag}${numbered && start !== 1 ? ` start="${start}"` : ''}>`;
      while (i < lines.length && pattern.test(lines[i])) {
        html += `<li>${inline(lines[i++].replace(pattern, ''))}</li>`;
        while (lines[i] === '' && pattern.test(lines[i + 1] || '')) i++;
      }
      html += `</${tag}>`; continue;
    }
    if (line.startsWith('> ')) { html += `<blockquote>${inline(line.slice(2))}</blockquote>`; i++; continue; }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |\||[-*] |\d+\. |```|> )/.test(lines[i])) paragraph.push(lines[i++]);
    html += `<p>${inline(paragraph.join(' '))}</p>`;
  }
  return html;
}
