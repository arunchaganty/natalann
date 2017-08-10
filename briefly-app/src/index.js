import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

// let rawContents = document.getElementById('input-document').value;
// let contents = JSON.parse(rawContents);
let contents = {
  "title": "Base Motives",
  "paragraphs": [
    "Trump panders exclusively to the minority of people who love him—and to hell with the rest of America. That’s exactly what Putin wants.",
    "On Jan. 6, two weeks before Donald Trump was sworn in as president, leaders of the U.S. intelligence community presented him with a report on Russian interference in the 2016 U.S. presidential election. Since then, Trump has refused to accept their consensus on Russia’s guilt, and his aides have been caught—in a chain of emails from June 2016—colluding with Russian intermediaries. But out in the open, Trump has done something far more destructive. He has pursued the central Russian objective outlined in the report: the political dissolution of the United States.",
    "The overarching goal of Vladimir Putin’s hacking and disinformation campaign, according to the Jan. 6 report, wasn’t to elect Trump or defeat Hillary Clinton. It was to “undermine public faith in the US democratic process.” An appendix to the report noted that Russian propaganda in the U.S. “aimed at promoting popular dissatisfaction with the US Government.” A separate expert analysis prepared in October by the nonpartisan Center for Strategic and International Studies and outlined to Congress in March described Russia’s strategy of sabotaging democracies by “deepening political divides,” “weakening the internal cohesion of societies,” and “using democratically elected individuals in positions of power to challenge the liberal system from within.”"
  ]};
console.log(contents);

ReactDOM.render(<App contents={contents} />, document.getElementById('root'));
registerServiceWorker();
