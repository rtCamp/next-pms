export const FORMATTED =
  '<p>Agreed. <span class="mention" data-type="mention" data-id="priya@example.com" data-label="Priya Shah">@Priya Shah</span> can you share the <strong>estimate</strong> by <em>Friday</em>? See the <a href="https://example.com/spec">spec</a>.</p>';

export const LISTS =
  "<p>Release checklist:</p><ul><li><p>Freeze the branch</p></li><li><p>Run the migrations</p></li></ul><ol><li><p>Tag</p></li><li><p>Deploy</p></li></ol>";

export const CODE =
  '<p>The fix:</p><pre><code class="language-javascript">const total = rows.reduce((sum, row) =&gt; sum + row.hours, 0);\nconsole.log(total);</code></pre>';

export const QUOTE =
  "<blockquote><p>Ship the smallest change that fixes it.</p></blockquote><p>Noted.</p>";

export const UNSAFE =
  '<p>Hello</p><script>alert(2)</script><p onclick="alert(3)">World</p><p><a href="javascript:alert(1)">Open</a></p>';

export const TWO_PARAGRAPHS = "<p>First line</p><p>Second line</p>";

export const RICH_TEXT =
  '<p style="text-align: center">Goals for <mark data-color="#fef9c3" style="background-color: #fef9c3; color: inherit">Q4</mark></p><table><tbody><tr><th><p>Milestone</p></th><th><p>Due</p></th></tr><tr><td><p>Beta</p></td><td><p>Nov 1</p></td></tr></tbody></table><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Kick-off</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Launch</p></div></li></ul>';
