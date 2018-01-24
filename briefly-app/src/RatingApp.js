import React, { Component } from 'react';
import {Button, Glyphicon, Panel, Table, Well} from 'react-bootstrap';
import update from 'immutability-helper';
import Experiment from './Experiment.js'
import RatingWidget from './RatingWidget';
import SegmentList from './SegmentList';

import './RatingApp.css';

const BONUS_VALUE = '0.75';

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

  instructionsVersion() {
    return '20180123';
  }

  instructions() {
    return (<InstructionContents
      bonus={BONUS_VALUE}
      isFirstTime={this.state.firstView}
      editable={!this.state.instructionsComplete}
      onValueChanged={(val) => this.setState({instructionsComplete: val})}
      />);
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
    this.setState(state => {
      state = update(state, {output: {response: RatingWidget.handleValueChanged(state.output.response, valueChange)}});
      const canSubmit = this._canSubmit(state.output.response);
      if (state.canSubmit !== canSubmit) {
        state = update(state, {canSubmit: {$set: canSubmit}});
      }
      return state;
    });
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
      this.setState(state => update(state, RatingWidget.handleValueChanged(state, valueChange, this.props.questions)),
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
    for (let question of this.props.questions) {
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
            questions={this.props.questions}
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
  questions: Object.keys(RatingWidget.QUESTIONS),
  expected: undefined,
  editable: true,
  onChanged: () => {},
  successPrompt: "",
  wrongPrompt: "",
}

class InstructionContents extends Component {
  constructor(props) {
    super(props);

    this.state = this.initState(props);
    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  INSTRUCTION_KEY = {
  };

  initState(props) {
    if (props.isFirstTime) {
      return {};
    } else  {
      return this.INSTRUCTION_KEY;
    }
  }

  handleValueChanged(update_) {
    this.setState(update_, () => Object.keys(this.INSTRUCTION_KEY).every(k => this.state[k]) && this.props.onValueChanged(true));
  }

  render() {
    let lede = (this.props.isFirstTime)
        ?  (<p>
          <b>Before you proceed with the HIT, you must complete the tutorial below</b> (you only need to do this once though!).
          The tutorial should take about <i>5 minutes to complete</i> and you will get <b>a (one-time) ${this.props.bonus} bonus</b> for completing it.
          </p>)
        : undefined;

    return (<div>
      {lede}

      <h3>General instructions</h3>
      <p>
        We'd like you to rate how good a short summary of a news article
        is by answering a few questions.&nbsp;
        <b>We will explain each of these questions below with a brief quiz at
        the end of each section. You must correctly answer the quiz
        question to proceed.</b>&nbsp;
      </p>

      <p>
      For each question, you will need to highlight portions of the
      document that support your decision. To do so, voodoo.
      </p>

      <h3>{RatingWidget.QUESTIONS.grammar.prompt}</h3>
      <p>A good summary should have no obvious grammar
      errors (<i>"Bill Clinton going to Egypt was ."</i>) that make the text
      difficult to read.</p>


      <Example
        title="1a. Evaluating fluency"
        text="Thousands of South Africans take to the streets of to rally in Durban . # ▃ , # ▃ and # ▃ are some of the most popular . `` people listen him , '' says ."
        questions={["grammar"]}
        expected={({ratings: {grammar: -1}, selections: {grammar: []}})}
        onChanged={(evt) => this.handleValueChanged({"judgement-3": evt})}
        editable={this.props.editable}
      />
      </div>);
  }
}
InstructionContents.defaultProps = {
  bonus: 0.50,
  isFirstTime: false,
  editable: false,
  onValueChanged: () => {},
}



export default App;
