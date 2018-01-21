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
        () => this.props.onChanged(this.checkAnswer())
      );
    }
  }

  checkAnswer() {
    const self = this;
    if (this.state.plausibility === undefined) {
      return undefined;
    } else if (this.state.plausibility !== this.props.expected.plausibility) {
      return false;
    } else if (this.state.selections.length > 0 && 
               this.state.selections.some((p,i) => p !== undefined &&
                  SegmentList.jaccard(p, self.props.expected.selections[i]) < 0.5)) {
      return false; // say things are false early.
    } else if (this.state.passages.length > 0 && 
               this.state.passages.some((p,i) => p !== undefined && p !== self.props.expected.passages[i])) {
      return false; // say things are false early.
    } else if (this.state.passages.length > 0 && this.state.passages.includes(undefined)) {
      return undefined;
    } else {
      return true;
    }
  }

  renderWell() {
    const status = this.checkAnswer();
    const bsStyle = (status === undefined) ? "primary" : (status) ? "success" : "danger";
    const well = 
      (status === true) ? (<span><b>That's right!</b> {this.props.successPrompt}</span>)
      : (status === false) ? (<span><b>Hmm.. that doesn't seem quite right.</b> {this.props.wrongPrompt}</span>)
      : undefined;

    return well && (<Well bsStyle={bsStyle}>{well}</Well>);
  }

  render() {
    const title = this.props.title && (<h3><b>{this.props.title}</b></h3>);
    const status = this.checkAnswer();
    const bsStyle = (status === undefined) ? "primary" : (status) ? "success" : "danger";

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
        {this.renderWell()}
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
