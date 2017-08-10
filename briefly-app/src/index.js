import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

let rawContents = document.getElementById('input-document').value;
let estimatedTime = document.getElementById('input-time').value;
let reward = document.getElementById('input-reward').value;

let contents;
if (rawContents.length > 0 && rawContents[0] !== '$') {
  contents = JSON.parse(rawContents);
} else {
  contents = {
    "title": "Title",
    "paragraphs": ["A line of text."]
  };
}

ReactDOM.render(<App contents={contents} estimatedTime={estimatedTime} reward={reward} />, document.getElementById('root'));
registerServiceWorker();

// Some hijinks for AMT
if (document.getElementById('submitButton') !== null) {
  document.getElementById('submitButton').remove(); 
}
