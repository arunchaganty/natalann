import React, { Component } from 'react';
import {Button, Glyphicon, Panel, Table} from 'react-bootstrap';
import update from 'immutability-helper';
import Experiment from './Experiment.js'
import SelectableDocument from './SelectableDocument.js'
import LikertGroup from './LikertGroup.js'

import './RatingApp.css';

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
    return (<Panel
              id="document"
              bsStyle="primary"
              header={<b>Please read the summary below and rate it</b>}
              >
          <SelectableDocument 
              id="document-contents"
              text={this.props.contents[this.state.currentIdx].text}
              onValueChanged={this.handleValueChanged}
              editable={true}
              /> 
          <Table>
            <thead>
              <tr>
                <th>Question</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="active">
                <td>How grammatical is the above paragraph?</td>
                <td>1</td>
                <td>2</td>
                <td>3</td>
                <td><Button bsStyle="warning">Please highlight text to support your position</Button></td>
                </tr>
            </tbody>
          </Table>
        </Panel>);
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
