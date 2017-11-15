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
      <p className="lead">We'd like you to edit a given paragraph to
      make it <u>grammatically correct</u>, <u>more readable</u>,
      while <u>preserving the original meaning and spirit</u> where
      possible.</p>

      <p>
      For example, the passage:
      <blockquote>
      A sheriff's deputy is accused of shooting a man in the bahamas for
      a family vacation. He is accused of shooting a man in the bahamas
      for a family vacation. He has apologized to the harris family.
      </blockquote>
      could be edited to remove the redundant second line:
      <blockquote>
      A sheriff's deputy is accused of shooting a man in the bahamas for
      a family vacation. He has apologized to the harris family.
      </blockquote>
      </p>

      <p>It's also possible that some parts of the text make no sense in the context of the sentence: you can delete these parts. For example,
        <blockquote>
        <s>"The Tonight Show starring Jimmy Fallon," was a guest on "The Tonight Show starring Jimmy Fallon hits hot 100 with 'ew!,' featuring will.i.am.</s>
        </blockquote>
      </p>


      <h3>General guidelines</h3>
      <ul>
        <li>
          It's possible that the given sentence is grammatical and does
        not need any edits in which case you can submit the text as is
        after a few seconds.
        </li>
        <li>If you want to undo your changes and return to the original text, click the <Button bsStyle="warning"><Glyphicon glyph="backward" /> Undo</Button> button.</li>
      </ul>
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
  estimatedTime: 20,
  reward: 0.30,
}

export default App;
