import React, { Component } from 'react';
import { Panel, Well } from 'react-bootstrap';
import update from 'immutability-helper';
import QAPrompt from './QAPrompt';

/***
 * Renders a document within a div.
 */
class Example extends Component {
  constructor(props) {
    super(props);

    this.state = {
      plausibility: undefined,
      passages: props.passages.map(_ => undefined),
      idx: 0,
    };

    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props !== nextProps) || (this.state !== nextState);
  }

  handleValueChanged(evt) {
    const valueChange = evt;
    this.setState(state => update(state, QAPrompt.handleValueChanged(state, valueChange)));
  }

  checkAnswer() {
    const self = this;
    if (!this.props.editable) return true;
    if (this.state.plausibility === undefined) {
      return undefined;
    } else if (this.state.plausibility !== this.props.expected.plausibility) {
      return false;
    } else if (this.state.passages.length > 0 && 
               this.state.passages.some((p,i) => p !== undefined && p !== self.props.exepected[i])) {
      return false;
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
          value={this.props.editable ? this.state : this.expected}
          onValueChanged={this.props.editable ? this.handleValueChanged : () => {}}
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
  expected: {plausibility: true},
  editable: true,
  onStateChanged: () => {},
  successPrompt: "",
  wrongPrompt: "",
}

export default Example;
