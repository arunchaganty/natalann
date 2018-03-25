import React, { Component } from 'react';
import {Alert, Button, ButtonGroup, Glyphicon, Table} from 'react-bootstrap';
import './QAPrompt.css';
import NaryAnswer from './NaryAnswer';
import SelectableDocument from './SelectableDocument';
import SegmentList from './SegmentList';

const PlausibilityOptions = [{
    style: "success",
    glyph: "ok",
    tooltip: "The answer seems reasonable for the question.",
    value: true},{
    style: "danger",
    glyph: "remove",
    tooltip: "Either the question doesn't make sense (e.g. 'the male Capybara') or the answer doesn't even make sense for the question (e.g. 'umbrella' for 'Who founded General Motors?')",
    value: false}
];

const EntailmentOptions = [{
    style: "success",
    glyph: "ok",
    tooltip: "The answer appears correct according to this passage.",
    value: 1},{
    style: "warning",
    glyph: "minus",
    tooltip: "The passage doesn't help answer the question",
    value: 0},{
    style: "danger",
    glyph: "remove",
    tooltip: "The answer appears incorrect according to this passage.",
    value: -1}];

const ConfirmationOptions = [{
    style: "success",
    glyph: "ok",
    tooltip: "Yes, the content on the right is accurate and justified by the highlighted regions.",
    value: true
  }];

const STYLES = new Map([[1, "success"], [0, "warning"], [-1, "danger"], ["alert", "default"]]);
const GLYPHS = new Map([[1, "ok-sign"], [0, "minus-sign"], [-1, "remove-sign"], ["alert", "exclamation-sign"]]);

class QAPrompt extends Component {
  constructor(props) {
    super(props);
  }

  static initialValue(passages) {
    return {
      plausibility: undefined,
      passages: passages.map(_ => undefined),
      confirmations: passages.map(_ => undefined),
      selections: passages.map(_ => []),
      idx: 0,
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.value !== nextProps.value);
  }

  static getStatus(value, idx) {
    if (value.passages[idx] === undefined) return "incomplete";
    if (value.passages[idx] === 0) return "complete";
    if (value.selections[idx].length === 0) return "missing-highlight";
    if (value.confirmations[idx] !== true) return "missing-confirmation";
    return "complete";
  }

  renderHistory() {
    if (this.props.value.plausibility !== true || this.props.passages.length === 0) return null;

    const self = this;
    let buttons = this.props.value.passages.map((p, i) => {
      const status = QAPrompt.getStatus(this.props.value, i);
      if (status !== "complete" && status !== "incomplete") {
        p = "alert";
      }
      return (<Button key={i}
          onClick={() => self.props.value.idx !== i && self.props.onValueChanged({moveTo: i}) }
          bsStyle={STYLES.get(p)}
          active={self.props.value.idx === i}
        >
        {GLYPHS.has(p) ? (<Glyphicon glyph={GLYPHS.get(p)} />) : null}
      </Button>);
    });

    return (
      <tr>
      <td></td>
      <td>
      <ButtonGroup className="answerHistory pull-right"> <Button disabled><Glyphicon glyph="time" /></Button> {buttons} </ButtonGroup>
      </td>
      </tr>
    );
  }

  renderPassage() {
    if (this.props.value.plausibility !== true || this.props.passages.length === 0) return null;

    const currentPassage = this.props.passages[this.props.value.idx].passage_text;
    const passageValue = this.props.value.passages[this.props.value.idx];
    const selectionsValue = this.props.value.selections[this.props.value.idx];

    return (<tr>
      <td className="lead">
        Does the response <b>correctly answer the question <i>according to</i> this paragraph</b>? <br/>
        <NaryAnswer
        options={EntailmentOptions}
        value={passageValue}
        onValueChanged={resp => this.props.onValueChanged({passage: [this.props.value.idx, resp]})}
        />
      </td>
      <td>
        {((passageValue === 1 || passageValue === -1) && selectionsValue.length == 0) 
          ? (<Alert bsStyle="warning">Please highlight regions in the text below to justify your decision.</Alert>)
          : undefined}
      <blockquote>
        <SelectableDocument
          text={currentPassage}
          selections={selectionsValue}
          onValueChanged={resp => this.props.onValueChanged({selection: [this.props.value.idx, resp]})}
        />
      </blockquote>
      </td>
    </tr>);
  }

  renderConfirmation() {
    if (this.props.value.plausibility !== true || this.props.passages.length === 0) return null;

    const currentPassage = this.props.passages[this.props.value.idx].passage_text;
    const passageValue = this.props.value.passages[this.props.value.idx];
    const selectionValue = this.props.value.selections[this.props.value.idx];
    const confirmationValue = this.props.value.confirmations[this.props.value.idx];
    // Skip this row when value is undefined.
    if (passageValue === undefined || passageValue === 0 || selectionValue.length === 0) return null;

    return (<tr>
      <td className="lead">
        Please <b>confirm that the following is correct</b> <br/>
        <NaryAnswer
        options={ConfirmationOptions}
        value={confirmationValue}
        onValueChanged={resp => this.props.onValueChanged({confirm: [this.props.value.idx, resp]})}
        />
      </td>
      <td>
      <blockquote>
        <u>{this.props.answer}</u> is <b>{passageValue === -1 ? "not" : ""} an answer</b> for the question <u>{this.props.query}</u> because:
        <ul>
          {selectionValue.map(([s,e],i) => <li key={i}><i>{currentPassage.substring(s,e)}</i></li>)}
        </ul>
      </blockquote>
      </td>
    </tr>);
  }

  render() {
    const self = this;

    return (
      <Table className="QAPrompt">
        <tbody>
          <tr>
            <td width="25%" className="lead">For the <b>question</b>,</td>
            <td width="75%"><blockquote>{this.props.query}</blockquote></td>
          </tr>
          <tr>
            <td className="lead">
              Can you understand the question and <strong>is this a plausible response to the question</strong>? <br/>
              <NaryAnswer
                options={PlausibilityOptions}
                value={this.props.value.plausibility}
                onValueChanged={resp => this.props.onValueChanged({plausibility:resp})}
              />
            </td>
            <td><blockquote>{this.props.answer}</blockquote></td>
          </tr>
          {this.renderPassage()}
          {this.renderConfirmation()}
          {this.renderHistory()}
        </tbody>
      </Table>);
  }
}

// Handles updating own value.
QAPrompt.nextIdx = function(value) {
  let ret = value.passages.findIndex((v, i) => i !== value.idx && QAPrompt.getStatus(value, i) !== "complete");
  return (ret === -1) ? value.idx : ret; 
}

QAPrompt.handleValueChanged = function(value, valueChange) {
  if (valueChange.plausibility !== undefined) {
    return {plausibility: {$set: valueChange.plausibility}};
  } else if (valueChange.selection !== undefined) {
    const [idx, evidence] = valueChange.selection;
    return {
      selections: {$splice: [[idx, 1, SelectableDocument.updateState(value.selections[idx], evidence)]]},
    };
  } else if (valueChange.passage !== undefined) {
    const [idx, evidence] = valueChange.passage;

    return {
      passages: {$splice: [[idx, 1, evidence]]},
      confirmations: (evidence !== value.confirmations[idx]) ? {$splice: [[idx, 1, undefined]]} : {}, // reset confirmation
      idx: (evidence === 0) ? {$set: QAPrompt.nextIdx(value)} : {},
    };
  } else if (valueChange.confirm !== undefined) {
    const [idx, evidence] = valueChange.confirm;
    return {
      confirmations: {$splice: [[idx, 1, evidence]]}, // reset confirmation
      idx: (evidence === true) ? {$set: QAPrompt.nextIdx(value)} : {},
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
  value: QAPrompt.initialValue(["", ""]),
  onValueChanged: () => {},
  disabled: false,
}

export default QAPrompt;
