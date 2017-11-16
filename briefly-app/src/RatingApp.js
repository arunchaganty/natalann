import React, { Component } from 'react';
import {Button, Glyphicon, Panel} from 'react-bootstrap';
import update from 'immutability-helper';
import './EditingApp.css';
import Experiment from './Experiment.js'
import Document from './Document.js'
import LikertGroup from './LikertGroup.js'

class App extends Experiment {
  title() {
    return (<p>Rate the short summary below</p>);
  }
  subtitle() {
    return null; //(<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }
  instructions() {
    return (
      <div>
      <p className="lead">
        We'd like you to rate how good a short summary of a news article is.
        Please carefully read the summary first, and then answer the
        questions below.
      </p>

      <p>
      Here is a brief motivation for each the questions we are asking:
      <ul>
        <li><b>How grammatical was the summary?</b>&nbsp;
          A grammatical summary should have no spelling errors or obvious grammar
      errors (<i>"Bill Clinton was going to."</i>) that make the text
      difficult to read.
        </li>
        <li><b>How redundant was the summary?</b>&nbsp;
          A good summary should not have any unnecessary repetition,
      which can arise if a sentence is repeated multiple times or uses
      full names (<i>"Bill Clinton"</i>) or long phrases (<i>"the Affordable Care Act"</i>) repeatedly instead of a
      pronoun (<i>"he"</i>) or short phrases (<i>"the law"</i>).
        </li>
        <li><b>How often could you understand who/what was mentioned in the summary?</b>
          In a good summary, it should be easy to identify who or what
      pronouns (<i>"he"</i>) and noun phrases (<i>"the law"</i>) are referring to
      within the summary.
        </li>
        <li><b>How clear was the focus of the summary?</b>&nbsp;
          A good summary has a clear focus and sentences should only contain information that is related to the rest of the summary.
        </li>
        <li><b>How coherent was the summary?</b>&nbsp;
          A coherent summary should be well-structured in that it should
      not just be a heap of related information, but should build from
      sentence to sentence to a coherent body of information about a
      topic.
        </li>
      </ul>
      </p>

      </div>
    );
  }

  constructor(props) {
    super(props);
    this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {output: {$merge: {
      responses: {
        "grammar": undefined,
        "redundancy": undefined,
        "clarity": undefined,
        "focus": undefined,
        "coherence": undefined,
        },
      }
    }});

    return state;
  }

  handleAnswersChanged(evt) {
    const value = evt;
    this.setState(state => {
      state = update(state, {output: {responses: {$merge: value}}}); 
      if (Object.values(state.output.responses).every(x => x !== undefined)) {
        state = update(state, {canSubmit: {$set: true}});
      }
      return state;
    });
  }

  renderContents() {
    const questions = [
      ["grammar", 
          "How grammatical was the summary?",
          "Not at all",
          "Perfectly"],
      ["redundancy", 
        "How redunant was the summary?",
        "Very redundant",
        "Not redundant"],
      ["clarity", 
        "How often could you understand who/what was mentioned in the summary?",
        "Never",
        "Always"],
      ["focus", 
        "How clear was the focus of the summary?",
        "Not at all",
        "Perfectly"],
      ["coherence", 
        "How coherent was the summary?",
        "Not at all",
        "Perfectly"],
    ];

    return (<div>
        <div>
          <Document 
              id="edit-document"
              title="Please read the text below and answer the questions below"
              text={this.props.contents.text}
              editable={false}
              /> 
        </div>
        <Panel header={<b>Please rate the above summary on the following qualities</b>}>
          <LikertGroup name="responses" questions={questions} value={this.state.output.responses} onChange={this.handleAnswersChanged} />
        </Panel>
      </div>);
  }
}

App.defaultProps = {
  contents: {id:"", text: "This is a test sentence."},
  estimatedTime: 90,
  reward: 0.30,
}

export default App;
