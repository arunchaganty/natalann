import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './SelectAcceptabilityApp';

function setupSubmit() {
  // Copied from http://james.padolsey.com/javascript/bujs-1-getparameterbyname/
  function getUrlParam(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
  }

  try {
    var submit_to = getUrlParam('turkSubmitTo');
    document.getElementById('mturk-form').setAttribute("action", submit_to + '/mturk/externalSubmit');
    document.getElementById('assignmentId').value = getUrlParam('assignmentId');
  } catch (err) {
    console.error(err);
  }
}

let props = {}; 
try {
  props = JSON.parse(document.getElementById('input').value);
} catch(err) {
  console.info("Ignorning input in #input");
  props = {};
}

setupSubmit();

ReactDOM.render(<App {...props} />,
 document.getElementById('root'));
