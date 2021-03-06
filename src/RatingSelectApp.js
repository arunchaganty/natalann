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
    return (<p>Rate the short paragraph below</p>);
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
    return (<Panel id="document" bsStyle="primary">
      <Panel.Heading><Panel.Title><b>Please read the paragraph below and rate it</b></Panel.Title> </Panel.Heading>
      <Panel.Body>
          <RatingWidget
            text={this.props.contents.text}
            value={this.state.output.response}
            onValueChanged={this.handleValueChanged}
          />
      </Panel.Body>
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
      if (this.state.ratings[question] === undefined) {
        ret = "incomplete";
      } else if (this.state.ratings[question] !== this.props.expected.ratings[question]) {
        return "wrong";
      } else if (SegmentList.jaccard(this.state.selections[question], this.props.expected.selections[question]) < 0.01) {
          return "wrong";
      } else if (SegmentList.jaccard(this.state.selections[question], this.props.expected.selections[question]) < 0.3) {
          return "poor-highlight";
      } else if (RatingWidget.getStatus(this.state, question) === "incomplete") {
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
      <Panel bsStyle={bsStyle}>
      <Panel.Heading><Panel.Title>{title}</Panel.Title></Panel.Heading>
      <Panel.Body>
        <p>{this.props.leadUp}</p>
          <RatingWidget
            text={this.props.text}
            value={this.state}
            questions={this.props.questions}
            onValueChanged={this.handleValueChanged}
          />
        {this.renderWell(status)}
      </Panel.Body>
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

class InstructionsBlock extends Component {
  renderDefinitions() {
    let defns = [];
    for (let option of this.props.options) {
      defns.push(<dt key={"dt-"+option.value}>Rate it <Glyphicon glyph={option.glyph}/> if: </dt>);
      defns.push(<dd key={"dd-"+option.value}>{option.tooltip}</dd>);
    }
    return <dl className="dl-horizontal">{defns}</dl>;
  }

  renderHighlightNote() {
    let highlightOptions = this.props.options.filter(o => o.needsHighlight).map(o => <Glyphicon key={o.value} glyph={o.glyph} />);
    if (highlightOptions.length == 1) {
      return <p>If you have rated the text {highlightOptions[0]}, then you will also need to {this.props.highlightPrompt}.</p>
    } else if (highlightOptions.length > 1) {
      // intersperse with text.
      let nOptions = highlightOptions.length;
      for (let i = nOptions-1; i > 0; i--) {
        highlightOptions.splice(i, 0, " or ");
      }
      return <p>If you have rated the paragraph as one of {highlightOptions}, then you will also need to <u>{this.props.highlightPrompt}</u>.</p>
    }
  }

  render() {
    return (<div>
      {this.props.definition}
      {this.renderDefinitions()}
      
      {this.renderHighlightNote()}

      {this.props.examples.map(ex => (
              <Example
                key={ex.text}
                onChanged={(evt) => this.props.onChanged([ex.id, evt])}
                editable={this.props.editable}
                {...ex}
              />))}

    </div>);
  }
}
InstructionsBlock.defaultProps = {
  prompt: "This is a question?",
  definition: "The question is defined here.",
  examples: [],
  editable: true,
  onChanged: () => {},
};

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
      <p className="lead">
      Imagine that you are a grade-school English
      teacher reading short paragraphs written by your students: <u>we'd like
      you to identify mistakes by answering several questions about the
      paragraph.</u>
      </p>

      <p>
      In this instruction/tutorial, we will explain each of these questions below with a brief quiz at
      the end of each section. <b>You must correctly answer the quiz
      question to proceed.</b>
      </p>

      <h3>How to use the interface</h3>
      <ul>
        <li>For each question described below, you will need to <b>choose one of several options</b>.</li>
        <li>Often, you will then need to <b>highlight regions of the
          paragraph that support your decision using your mouse</b>.</li>
        <li>To <b>undo a selection, simply click on a highlighted region</b>.</li>
      <li>Sometimes the words written by the student are&nbsp;
        <b>undecipherable and are displayed as ▃ </b>. Here, <b>try to be generous</b>
        to the student and imagine what the word is likely to have been.
        For example, in <i>"Leighton ▃ is the first female jockey in the history of Polo."</i>, the ▃  is probably the person's last name.</li>
        <li>Finally, the <b>capitalization of some of these sentences may be correct</b>:
      for example, in <i>"from a man purporting to be Robert&nbsp;
      <u>durst</u>"</i>, <i>"durst"</i> should be capitalized. <b>Please be
      lenient and only mark such examples if you genuinely can't
      understand what was written.</b></li>
      </ul>

      <h3>Question definitions (and quiz!)</h3>

      {Object.keys(RatingWidget.QUESTIONS).map((q,i) => (
        <Panel key={q} defaultExpanded={true} eventKey={q}>
        <Panel.Heading><Panel.Title toggle><b>Q{i+1}. {RatingWidget.QUESTIONS[q].prompt}</b></Panel.Title></Panel.Heading>
        <Panel.Collapse> <Panel.Body>
          <InstructionsBlock
            editable={this.props.editable}
            {...RatingWidget.QUESTIONS[q]} />
        </Panel.Body></Panel.Collapse>
        </Panel>))}

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
