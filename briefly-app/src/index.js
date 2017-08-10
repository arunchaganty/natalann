import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

let rawContents = document.getElementById('input-document').value;
let estimatedTime = document.getElementById('input-time').value;
let reward = document.getElementById('input-reward').value;

let contents;

let url = new URL(window.location);
if (url.pathname.match(/\/([0-9])+/)) {
  let fname = url.pathname.match(/\/([0-9])+/)[1];
  axios.get("/data/pilot-out/" + fname + ".json")
    .then((result) => {
      contents = result.data;
      console.log(result.data);
      ReactDOM.render(<App contents={contents} estimatedTime={estimatedTime} reward={reward} />, document.getElementById('root'));
      registerServiceWorker();
    })
}

// if (rawContents.length > 0 && rawContents[0] !== '$') {
//   contents = JSON.parse(rawContents);
// } else {
//   contents = {
//     "title": "Title",
//     "paragraphs": ["A line of text."],
//     "selections": [[], [[0,3, 1.0], [5, 7, 0.4]]]
//   };
// }

// Some hijinks for AMT
if (document.getElementById('submitButton') !== null) {
  document.getElementById('submitButton').remove(); 
}
