import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './RatingApp';

function setupSubmit() {
  // Copied from http://james.padolsey.com/javascript/bujs-1-getparameterbyname/
  function getUrlParam(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
  }

  try {
    let submit_to = getUrlParam('turkSubmitTo');
    if (submit_to) {
      document.getElementById('mturk-form').setAttribute("action", submit_to + '/mturk/externalSubmit');
    }
    document.getElementById('assignmentId').value = getUrlParam('assignmentId');
  } catch (err) {
    console.error(err);
  }
}

function tryGetValue(id) {
  try {
    return JSON.parse(document.getElementById(id).value);
  } catch(err) {
    console.info("Ignorning input in #" + id);
    return undefined;
  }
}

let props = tryGetValue('_input'); 
if (props) {
  let output = tryGetValue('_output'); 
  props['_output'] = output;
}

setupSubmit();

ReactDOM.render(<App {...props} />,
 document.getElementById('root'));
