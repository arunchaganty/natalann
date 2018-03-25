import React from 'react';
import ReactDOMServer from 'react-dom/server';
import DOMRenderer from './DOMRenderer';

function reactToDOM(reactElement) {
  let dom = document.createElement("div");
  dom.innerHTML = ReactDOMServer.renderToStaticMarkup(reactElement);
  dom = dom.childNodes[0];
  return dom;
}

var obj = (<div>
    <p id="1">This is a test <span class="highlight">entry</span>.</p>
    <p id="2">This is a test <span class="highlight">entry</span>.</p>
    <p id="3">This is a test <span class="highlight">entry</span>.</p>
  </div>);
var html = ReactDOMServer.renderToStaticMarkup(obj);

it ('renders correctly', () => {
  let renderer = new DOMRenderer();
  let dom = reactToDOM(obj);
  let obj_ = renderer.render(dom);
  let html_ = ReactDOMServer.renderToStaticMarkup(obj_);
  expect(html_).toEqual(html);
});
