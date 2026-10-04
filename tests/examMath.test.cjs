const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

const source = fs.readFileSync(path.join(__dirname, '../src/components/ExamMathText.jsx'), 'utf8');
const compiled = transformSync(source, { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
const mod = { exports: {} };
vm.runInNewContext(compiled, {
  module: mod, exports: mod.exports,
  require: (name) => name.endsWith('.css') ? {} : require(name),
});
const ExamMathText = mod.exports.default;
const html = (text) => renderToStaticMarkup(React.createElement(ExamMathText, { text }));

test('renders inline, display, and bare LaTeX while preserving Thai prose', () => {
  assert.match(html('หา $\\frac{1}{2}$ ของจำนวน'), /หา .*class="katex".* ของจำนวน/);
  assert.match(html('$$x^{2}$$'), /katex-display/);
  assert.match(html('\\sqrt{x}'), /class="katex"/);
});

test('bad math stays readable and markup is escaped', () => {
  assert.match(html('$\\unknowncommand$'), /\\unknowncommand/);
  assert.doesNotMatch(html('<img src=x onerror=alert(1)>'), /<img/);
});
