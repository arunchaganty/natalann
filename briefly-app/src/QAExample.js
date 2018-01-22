import React, { Component } from 'react';
import { Panel, Well } from 'react-bootstrap';
import update from 'immutability-helper';
import QAPrompt from './QAPrompt';
import SegmentList from './SegmentList';

/***
 * Renders a document within a div.
 */
class Example extends Component {
  constructor(props) {
    super(props);

    this.state = (this.props.editable) ? {
        plausibility: undefined,
        passages: props.passages.map(_ => undefined),
        selections: props.passages.map(_ => []),
        idx: 0,
      } : {
        plausibility: this.props.expected.plausibility,
        passages: this.props.expected.passages,
        selections: this.props.expected.selections,
        idx: 0,
      };

    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props !== nextProps) || (this.state !== nextState);
  }

  handleValueChanged(evt) {
    const valueChange = evt;
    if (this.props.editable || valueChange.moveTo !== undefined) {
      this.setState(state => update(state, QAPrompt.handleValueChanged(state, valueChange)),
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
    if (this.state.plausibility === undefined) {
      return "incomplete";
    } else if (this.state.plausibility !== this.props.expected.plausibility) {
      return "wrong";
    } else if (this.state.selections.length > 0 && 
               this.state.selections.some((p,i) => p !== undefined && p.length > 0 && SegmentList.jaccard(p, self.props.expected.selections[i]) < 0.01)) {
          return "wrong";
    } else if (this.state.selections.length > 0 && 
               this.state.selections.some((p,i) => p !== undefined  && p.length > 0 && SegmentList.jaccard(p, self.props.expected.selections[i]) < 0.3)) {
          return "poor-highlight";
    } else if (this.state.passages.length > 0 && 
               this.state.passages.some((p,i) => p !== undefined && p !== self.props.expected.passages[i])) {
      return "wrong"; // say things are false early.
    } else if (this.state.passages.length > 0 && this.state.passages.includes(undefined)) {
      return "incomplete";
    } else {
      return "correct";
    }
  }

  renderWell(status) {
    console.log(status);
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
        <QAPrompt
          query={this.props.query}
          answer={this.props.answer}
          passages={this.props.passages}
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
  query: "where are the submandibular lymph nodes located",
  answer: "below the jaw",
  passages: [],
  selections: [],
  expected: {plausibility: true},
  editable: true,
  onChanged: () => {},
  successPrompt: "",
  wrongPrompt: "",
}

export default Example;
