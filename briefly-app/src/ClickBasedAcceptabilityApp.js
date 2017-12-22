import React, { Component } from 'react';
import {Button, Glyphicon, Panel} from 'react-bootstrap';
import update from 'immutability-helper';
import './EditingApp.css';
import Experiment from './Experiment.js'
import DelayedDocument from './DelayedDocument.js'
import LikertGroup from './LikertGroup.js'
import Tutorial from './Tutorial.js'
import Instructions from './Instructions.js'

class App extends Experiment {
  constructor(props) {
    super(props);
    this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
  }

  title() {
    return (<p>Rate the short summary below</p>);
  }
  subtitle() {
    return null; //(<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }

  instructions() {
    return (<h3>Instructions</h3>);
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {
      output: {$merge: {
        responses: props.contents.map(_ => ({
          "grammar": undefined,
          "redundancy": undefined,
          "clarity": undefined,
          "focus": undefined,
          "coherence": undefined,
          "overall": undefined,
        }))}},
      currentIdx: {$set: 0},
      canNext: {$set: 0},
    });

    return state;
  }

  handleAnswersChanged(evt) {
    const value = evt;
    this.setState(state => {
      state = update(state, {output: {responses: {[state.currentIdx]: {$merge: value}}}});
      if (Object.values(state.output.responses[state.currentIdx]).every(x => x !== undefined)) {
        state = update(state, {canNext: {$set: true}});
        if (this.state.currentIdx == this.props.contents.length-1) {
          state = update(state, {canSubmit: {$set: true}});
        }
      }
      return state;
    });
  }

  handleSubmit(evt) {
    if (this.state.canSubmit) {
      console.assert(this.state.currentIdx == this.props.contents.length-1);
      return true;
    } else if (this.state.canNext) {
      console.assert(this.state.currentIdx < this.props.contents.length-1);

      this.setState(state => update(state, {$merge: {
        currentIdx: state.currentIdx+1,
        canNext: false,
        canSubmit: false,
      }}));
      evt.preventDefault();
      return false;
    } else {
      evt.preventDefault();
      return false;
    }
  }

  renderContents() {
    return (<div>
        <div>
          <DelayedDocument 
              bsStyle="primary"
              id="text"
              title="Please read the summary below and rate it below"
              editable={false}
              /> 
        </div>
        <Panel header={<b>Please rate the above summary on the following qualities</b>}>
          <LikertGroup name="responses" questions={App.questions} value={this.state.output.responses[this.state.currentIdx]} onChange={this.handleAnswersChanged} scale={3} />
        </Panel>
      </div>);
  }

  renderSubmit() {
    if (this.state.currentIdx < this.props.contents.length-1) {
      return (
        <Button type='button' disabled={!this.state.canNext} bsSize="large" bsStyle="primary" onClick={this.handleSubmit}><Glyphicon glyph="forward" /> Next ({this.state.currentIdx+1} / {this.props.contents.length}) </Button>
        );
    } else {
      return (
        <Button type='submit' disabled={!this.state.canSubmit} bsSize="large" bsStyle="success" onClick={this.handleSubmit}><Glyphicon glyph="ok" /> Submit</Button>
      );
    }
  }
}

App.questions = [
  ["grammar", 
    "How grammatical was the summary?",
    "Not at all",
    "Perfectly"],
  ["redundancy", 
    "How non-redunant was the summary?",
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
  ["overall", 
    "Overall, how good was the summary?",
    "Very bad",
    "Very good"],
];

App.defaultProps = {
  contents: [
    {id:"", text: "This is test sentence 1.", reference: "This is another sentence 1."},
    {id:"", text: "This is test sentence 2.", reference: "This is another sentence 2."},
    {id:"", text: "This is test sentence 3.", reference: "This is another sentence 3."},
  ],
  estimatedTime: 300,
  reward: 1.25,
  instructionsVersion: '20171214',
}

export default App;
