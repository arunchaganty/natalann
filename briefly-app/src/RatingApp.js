import React, { Component } from 'react';
import {Button, Glyphicon, Panel, Table} from 'react-bootstrap';
import update from 'immutability-helper';
import Experiment from './Experiment.js'
import RatingWidget from './RatingWidget';

import './RatingApp.css';

class App extends Experiment {
  constructor(props) {
    super(props);
    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  title() {
    return (<p>Rate the short summary below</p>);
  }
  subtitle() {
    return null; //(<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {
      output: {$merge: {
        response: RatingWidget.initValue(),
        }},
    });

    return state;
  }

  handleSubmit(evt) {
    if (this.state.canSubmit) {
      return true;
    } else {
      evt.preventDefault();
      return false;
    }
  }

  _canSubmit(response) {
    return RatingWidget.isComplete(response);
  }

  handleValueChanged(evt) {
    const valueChange = evt;
    console.log(evt);
    this.setState(state => {
      state = update(state, {output: {response: RatingWidget.handleValueChanged(state.output.response, valueChange)}});
      const canSubmit = this._canSubmit(state.output.response);
      if (state.canSubmit !== canSubmit) {
        state = update(state, {canSubmit: {$set: canSubmit}});
      }
      return state;
    }, () => console.log(this.state.output.response));
  }

  renderContents() {
    return (<Panel
              id="document"
              bsStyle="primary"
              header={<b>Please read the summary below and rate it</b>}
              >
          <RatingWidget
            value={this.state.output.response}
            onValueChanged={this.handleValueChanged}
          />
        </Panel>);
  }

}

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
