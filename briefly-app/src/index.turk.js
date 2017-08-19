import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './index.css';
import App from './App';

function loadPage(contents, estimatedTime, reward) {
  ReactDOM.render(<App contents={contents} estimatedTime={estimatedTime} reward={reward} />, document.getElementById('root'));
}

const url = new URL(window.location);
const estimatedTime = document.getElementById('input-time').value;
const reward = document.getElementById('input-reward').value;
const rawContents = document.getElementById('input-document').value;

// Better mechanism to select which to render.
if (url.pathname.match(/\/([0-9]+)/)) {
  let fname = url.pathname.match(/\/([0-9]+)/)[1];
  console.log("Getting file " + fname);
  axios.get("/data/pilot-20170817/" + fname + ".json")
    .then((result) => {
      let contents = result.data;
      loadPage(contents, estimatedTime, reward);
    })
} else 
  if (rawContents.length > 0 && rawContents[0] !== '$') {
  let contents = JSON.parse(rawContents);
  loadPage(contents, estimatedTime, reward);
} else {
  let contents = {
    "title": "Title",
    "paragraphs": ["A line of text."],
    "viewSelections": [],
    "recommendedMinWordCount": 10,
    "recommendedMaxWordCount": 50,
    "prompt": "",
  };
  loadPage(contents, estimatedTime, reward);
}

// Some hijinks for AMT
if (document.getElementById('submitButton') !== null) {
  document.getElementById('submitButton').remove(); 
}
