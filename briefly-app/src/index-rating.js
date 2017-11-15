import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './RatingApp';

let props = {}; 
try {
  props = JSON.parse(document.getElementById('input').value);
} catch(err) {
  console.info("Ignorning input in #input");
  props = {};
}
console.log(props);

ReactDOM.render(<App {...props} />,
 document.getElementById('root'));
