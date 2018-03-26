import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './{appName}';

// Set up parameters for the interface using _input/_output.
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

ReactDOM.render(<App {...props} />,
 document.getElementById('root'));
