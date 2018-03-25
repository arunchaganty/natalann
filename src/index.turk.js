import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './index.css';
// This gets changed based on what we're testing.
// import App from './AttentionApp';
import App from './EditingApp';

function loadPage(contents, estimatedTime, reward) {
  ReactDOM.render(<App contents={contents} estimatedTime={estimatedTime} reward={reward} />, document.getElementById('root'));
}

const url = new URL(window.location);
const estimatedTime = document.getElementById('input-time').value;
const reward = document.getElementById('input-reward').value;
const rawContents = document.getElementById('input-document').value;

// Better mechanism to select which to render.
if (rawContents.length > 0 && rawContents[0] !== '$') {
  let contents = JSON.parse(rawContents);
  loadPage(contents, estimatedTime, reward);
} else {
  console.log("Loading default contents");
  let contents = {
    "id": "",
    "text": "A line of text.",
  };
  loadPage(contents, estimatedTime, reward);
}

// Some hijinks for AMT
if (document.getElementById('submitButton') !== null) {
  document.getElementById('submitButton').remove(); 
}
