import React from 'react';
import ReactDOMServer from 'react-dom/server';
import DOMRenderer from './DOMRenderer';

var obj = (<div>
    <p id="1">This is a test <span class="highlight">entry</span>.</p>
    <p id="2">This is a test <span class="highlight">entry</span>.</p>
    <p id="3">This is a test <span class="highlight">entry</span>.</p>
  </div>);
var html = ReactDOMServer.renderToStaticMarkup(obj);

it ('renders correctly', () => {
  let renderer = new DOMRenderer();
  var dom = document.createElement("div");
  dom.innerHTML = html;
  dom = dom.childNodes[0];
  let obj_ = renderer.render(dom);
  let html_ = ReactDOMServer.renderToStaticMarkup(obj_);
  expect(html_).toEqual(html);
});

