import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

let rawContents = document.getElementById('input-document').value;
let contents = JSON.parse(rawContents);
console.log(contents);

ReactDOM.render(<App contents={contents} />, document.getElementById('root'));
registerServiceWorker();
