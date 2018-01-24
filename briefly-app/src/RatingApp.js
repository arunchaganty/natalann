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
        response: RatingWidget.initialValue(),
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
            text={this.props.contents.text}
            value={this.state.output.response}
            onValueChanged={this.handleValueChanged}
          />
        </Panel>);
  }

}

App.defaultProps = {
  contents: {text: "This is test sentence 1.", reference: "This is another sentence 1."},
  estimatedTime: 300,
  reward: 1.25,
}

class Example extends Component {
  constructor(props) {
    super(props);

    this.state = (this.props.editable) ? RatingWidget.initialValue(this.props.questions) : Object.assign({}, this.props.expected);
    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props !== nextProps) || (this.state !== nextState);
  }

  handleValueChanged(evt) {
    const valueChange = evt;
    if (this.props.editable || valueChange.moveTo !== undefined) {
      this.setState(state => update(state, RatingWidget.handleValueChanged(state, valueChange)),
        () => {
          let status = this.checkAnswer();
          let ret = (status === "correct") ? true : (status === "wrong") ? false : undefined;
          this.props.onChanged(ret);
        }
      );
    }
  }

  checkAnswer() {
    const self = this;

    let ret = "correct";
    for (let question in Object.keys(this.state.ratings)) {
      if (this.state.ratings[question] !== undefined 
        && this.state.ratings[question] !== this.props.expected.ratings[question]) {
        return "wrong";
      } 
      if (SegmentList.jaccard(this.state.selections[question], this.props.expected.selections[question]) < 0.01) {
          return "wrong";
      }
      if (SegmentList.jaccard(this.state.selections[question], this.props.expected.selections[question]) < 0.3) {
          return "poor-highlight";
      }
      if (RatingWidget.getStatus(this.state, question) === "incomplete") {
        ret = "incomplete";
      }
    }
    return ret;
  }

  renderWell(status) {
    const bsStyle = (status === "incomplete") ? "primary" : (status === "correct") ? "success" : "danger";
    const well = 
      (status === "correct") ? (<span><b>That's right!</b> {this.props.successPrompt}</span>)
      : (status === "wrong") ? (<span><b>Hmm... that doesn't seem quite right.</b> {this.props.wrongPrompt}</span>)
      : (status === "poor-highlight") ? (<span><b>Hmm... the highlighted region could be improved.</b></span>)
      : undefined;

    return well && (<Well bsStyle={bsStyle}>{well}</Well>);
  }

  render() {
    const title = this.props.title && (<h3><b>{this.props.title}</b></h3>);
    const status = this.checkAnswer();
    const bsStyle = (status === "incomplete") ? "primary" : (status === "correct") ? "success" : "danger";

    return (
      <Panel header={title} bsStyle={bsStyle}>
        <p>{this.props.leadUp}</p>
          <RatingWidget
            text={this.props.text}
            value={this.state}
            onValueChanged={this.handleValueChanged}
          />
        {this.renderWell(status)}
      </Panel>
    );
  }
}

Example.defaultProps = {
  id: "#example",
  title: "#. Description of example.",
  text: "This is a great sentence.",
  expected: undefined,
  editable: true,
  onChanged: () => {},
  successPrompt: "",
  wrongPrompt: "",
}

export default App;
