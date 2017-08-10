import React from 'react';
import ReactDOMServer from 'react-dom/server';
import DOMTransformer from './DOMTransformer';

function reactToDOM(reactElement) {
  let dom = document.createElement("div");
  dom.innerHTML = ReactDOMServer.renderToStaticMarkup(reactElement);
  dom = dom.childNodes[0];
  return dom;
}

var obj = (<div>
    <p id="1">This is a test entry.</p>
    <p id="2">This is a test entry.</p>
    <p id="3">This is a test entry.</p>
  </div>);
var dom = reactToDOM(obj);

it('returns original dom without selections', () => {
  let transformer = new DOMTransformer();
  let dom_ = transformer.transform(dom, []);
  expect(dom_).toEqual(dom);
});

it('returns original dom with selections', () => {
  let domFinal = reactToDOM(<div>
      <p id="1"><span className='hl'>This</span> is a test entry.</p>
      <p id="2">This is a test entry.</p>
      <p id="3">This is a test entry.</p>
    </div>);

  let transformer = new DOMTransformer();
  let transforms = [
    [[0,0], [0, 5], <span className='hl' />],
  ];

  let dom_ = transformer.transform(dom, [0]);
  expect(dom_).toEqual(domFinal);
});


it('returns original dom with cross-element selection', () => {
  let domFinal = reactToDOM(<div>
      <p id="1">This is a test entry.</p>
      <p id="2">This <span>is a test entry.</span></p>
      <p id="3"><span>This is a </span>test entry.</p>
    </div>);

  let transformer = new DOMTransformer();
  let transforms = [
    [[1,5], [2, 11], <span />],
  ];

  let dom_ = transformer.transform(dom, [0]);
  console.log(dom_.innerHTML);
  console.log(domFinal.innerHTML);
  expect(dom_).toEqual(domFinal);
});
