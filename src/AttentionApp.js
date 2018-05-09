import React from 'react';
import {Panel} from 'react-bootstrap';
import update from 'immutability-helper';
import Experiment from './Experiment.js'
import Document from './SelectableRichDocument.js'
//import Instructions from './Instructions.js'

import './App.css';
import './AttentionApp.css';

class App extends Experiment {

  title() {
    return (<p>Highlight the most important portions of this article related to <u>{this.props.contents.prompt}</u></p>);
  }

  subtitle() {
    if (this.props.selectionMode === "click") {
      return (<p><b>Left-click to select and unselect words</b></p>);
    } else if (this.props.selectionMode === "select") {
      return (<p><b>Left-click and drag to select</b> and <b>right-click on to clear</b></p>);
    } else {
      console.assert(false, "Invalid selection mode");
    }
  }

  instructions() {
    return (
      <div>
      <p className="lead">We'd like you to highlight what you think are
      the most important bits of the article that talk the <u>underlined topic</u> (here, <u>{this.props.contents.prompt}</u>): imagine
      that you are shown only the highlighted portions-- would you be
      able to understand what the article was talking about the <u>topic</u>?</p>

      <h3>General guidelines</h3>
      <ul>
        <li>Click a word to select it and click again to unselect it.</li>
        <li>Feel free to ignore filler material, e.g., 
        <blockquote>
          <div className='SelectableDocument'>
            <span class="primary">President</span> <span class="primary">Kim</span> <span class="primary">Jong</span> <span class="primary">Un</span>, in a show of force, <span class="primary">threatened</span> to <span class="primary">attack</span> <span class="primary">Guam</span>.
          </div>
        </blockquote>
      </li>
        <li>Please keep highlights relevant to the <u>topic</u>, but do include any context you think is necessary; for example,
        <blockquote>
          <div className='document'>
            <span>Tensions</span> in the <span>Korean</span> <span>Peninusla</span> have <span>escalated</span> <span>after</span> <span>President</span> <span>Trump</span> <span>promised</span> <span>fire</span> and <span>fury</span> in response to any aggression from North Korea.
            <span>President</span> <span>Kim</span> <span>Jong</span> <span>Un</span>, in a show of force, <span>threatened</span> to <span>attack</span> <span>Guam</span>.
          </div>
        </blockquote>
      </li>
      <li>When the topic is <u>anything</u> highlight any parts of the article that you think are important.</li>
      </ul>
      </div>
    );
  }

  constructor(props) {
    super(props);

    this.handleSelectionChange = this.handleSelectionChange.bind(this);
  }

  initState(props) {
    let state = super.initState(props);

    state = update(state, {
      output: {$merge: {
        selections: Document.initState(props.contents.doc),
        wordCount: 0,
      }},
    });

    if (props._output) {
      state = update(state, {
        output: {$merge: props._output},
        canSubmit: {$set: this._canSubmit(props._output.selections)},
      });
    }

    return state;
  }

  getWordCount(selections) {
    // get word count.
    let wordCount = 0;
    const doc = this.props.contents.doc;
    for (let i = 0; i < selections.length; i++) {
      if (selections[i].length > 0) {
        let txt = (i === 0) ? doc.title : doc.paragraphs[i-1];
        for (let j = 0; j < selections[i].length; j++) {
          let [start, end] = selections[i][j];
          let segment = txt.substring(start, end);
          let ix = 0; 
          while (ix !== -1) {
            wordCount++;
            ix = segment.indexOf(' ', ix+1);
          }
        }
      }
    }
    return wordCount;
  }

  handleSelectionChange(_value) {
    const value = _value;
    this.setState(state => {
      const selections = Document.updateState(state.output.selections, value);
      return {
        output: {
          selections: selections,
          wordCount: this.getWordCount(selections),
        }
      };});
  }

  renderContents() {
    const articleTitle = (<p>
      Please highlight {this.props.contents.recommendedMinWordCount}–
      {this.props.contents.recommendedMaxWordCount} words in the article
      below that you think capture all the important details about the
      topic: <u>{this.props.contents.prompt}</u>.
      </p>);

    return (
      <Panel>
      <Panel.Heading><Panel.Title>
        {articleTitle}
      </Panel.Title></Panel.Heading>
      <Panel.Body>
          <Document 
              doc={this.props.contents.doc}
              value={this.state.output.selections}
              onValueChanged={this.handleSelectionChange}
            /> 
      </Panel.Body>
      </Panel>);
  }
}

App.defaultProps = {
  contents: {
    "id": 0,
    "doc": {
      "url": "http://www.nationalreview.com/article/450363/robert-mueller-paul-manafort-search-warrant-special-counsel-trump-russia-investigation",
      "title": "Mueller Is Squeezing Manafort",
      "paragraphs": 
      ["It gets curiouser and curiouser.",
       "The Washington Examiner catches some Trump Twitter intrigue: The president\u2019s July 26 tweet grousing that acting FBI director Andrew McCabe should have been fired by Attorney General Jeff Sessions came only hours after the FBI\u2019s raid on the Virginia home of Paul Manafort, the subject of my column yesterday.",
       "Obviously, the Examiner is deducing that there is a causal connection between the Manafort raid and Trump\u2019s tweet. This inference is reasonable, but not ineluctable.",
       "For present purposes, however, I am more interested in reports that business records, connected to Manafort\u2019s taxes and foreign bank transactions, were the object of the raid ordered by Special Counsel Robert Mueller. That seems peculiar if the rationale for ordering a home search, rather than simply issuing a subpoena, was fear that Manafort would destroy evidence.", "It makes perfect sense, though, if the prosecutor is playing hardball."
      ],
    },
    "prompt": "Mueller",
    "recommendedMaxWordCount": 40, "recommendedMinWordCount": 10,
    },
  estimatedTime: 60,
  reward: 0.70,
  selectionMode: "click",
};

export default App;
