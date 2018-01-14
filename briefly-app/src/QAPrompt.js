import React, { Component } from 'react';
import {Button, ButtonGroup, Glyphicon, Table} from 'react-bootstrap';
import './QAPrompt.css';
import NaryAnswer from './NaryAnswer';

const PlausibilityOptions = [{
    style: "success",
    glyph: "ok",
    tooltip: "The answer seems reasonable for the question.",
    value: true},{
    style: "danger",
    glyph: "remove",
    tooltip: "The answer doesn't even make sense for the question (e.g. 'umbrella' for 'Who founded General Motors?')",
    value: false}
];

const EntailmentOptions = [{
    style: "success",
    glyph: "ok",
    tooltip: "The answer is correct according to this passage.",
    value: 1},{
    style: "warning",
    glyph: "minus",
    tooltip: "The passage doesn't help answer the question",
    value: 0},{
    style: "danger",
    glyph: "remove",
    tooltip: "The answer is incorrect according to this passage.",
    value: -1}];

const STYLES = new Map([[1, "success"], [0, "warning"], [-1, "danger"]]);
const GLYPHS = new Map([[1, "ok-sign"], [0, "minus-sign"], [-1, "remove-sign"]]);

class QAPrompt extends Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.value !== nextProps.value);
  }

  renderHistory() {
    const self = this;
    let buttons = this.props.value.passages.map((p, i) => 
      (<Button key={i}
          onClick={() => self.props.value.idx !== i && self.props.onValueChanged({moveTo: i}) }
          bsStyle={STYLES.get(p)}
          active={self.props.value.idx === i}>
        {GLYPHS.has(p) ? (<Glyphicon glyph={GLYPHS.get(p)} />) : null}
      </Button>)
    );

    return (<ButtonGroup className="answerHistory"> {buttons} </ButtonGroup>);
  }

  renderPassages() {
    if (this.props.value.plausibility !== true || this.props.passages.length === 0) return null;

    const currentPassage = this.props.passages[this.props.value.idx].passage_text;
    const passageValue = this.props.value.passages[this.props.value.idx];

    return (<tr>
      <td className="lead">Is the answer (in)correct <i>according to</i> this paragraph?
        <hr/>
        {this.renderHistory()}
      </td>
      <td>
      <blockquote>
      {currentPassage}
      </blockquote>
      </td>
      <td>
      <NaryAnswer
      options={EntailmentOptions}
      value={passageValue}
      onValueChanged={resp => this.props.onValueChanged({passage: [this.props.value.idx, resp]})}
      />
      </td>
    </tr>);
  }

  render() {
    const self = this;

    return (
      <Table className="QAPrompt">
        <tbody>
          <tr>
            <td width="20%" className="lead">For the question,</td>
            <td width="65%">{this.props.query}</td>
            <td width="15%"></td>
          </tr>
          <tr>
            <td className="lead">Is this a plausible answer to the question?</td>
            <td>{this.props.answer}</td>
            <td>
              <NaryAnswer
                options={PlausibilityOptions}
                value={this.props.value.plausibility}
                onValueChanged={resp => this.props.onValueChanged({plausibility:resp})}
              />
            </td>
          </tr>
          {this.renderPassages()}
        </tbody>
      </Table>);
  }
}

// Handles updating own value.
QAPrompt.handleValueChanged = function(value, valueChange) {
  if (valueChange.plausibility !== undefined) {
    return {plausibility: {$set: valueChange.plausibility}};
  } else if (valueChange.passage !== undefined) {
    const [idx, evidence] = valueChange.passage;
    const nextIdx = value.passages.findIndex((v, i) => i !== idx && v === undefined);
    return {
      passages: {$splice: [[idx, 1, evidence]]},
      idx: {$set: ((nextIdx === -1) ? idx : nextIdx)},
    };
  } else if (valueChange.moveTo !== undefined) {
    return {idx: {$set: valueChange.moveTo}};
  } else {
    console.assert("Invalid event.");
    return {};
  }
}

// top 3 are givens,
// value is actually 'state'.
QAPrompt.defaultProps = {
  query: "This is a question",
  answer: "Answer",
  passages: ["Passage 1", "Passage 2",],
  value: {plausibility: undefined, passages: [undefined, undefined,], idx: 0},
  onValueChanged: () => {},
  disabled: false,
}

export default QAPrompt;
