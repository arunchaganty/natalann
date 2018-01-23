import React, { Component } from 'react';
import {Alert, Button, ButtonGroup, Glyphicon, Table} from 'react-bootstrap';
import './QAPrompt.css';
import NaryAnswer from './NaryAnswer';
import SelectableDocument from './SelectableDocument';

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

const STYLES = new Map([[1, "success"], [0, "warning"], [-1, "danger"], ["alert", "default"]]);
const GLYPHS = new Map([[1, "ok-sign"], [0, "minus-sign"], [-1, "remove-sign"], ["alert", "exclamation-sign"]]);

class QAPrompt extends Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.value !== nextProps.value);
  }

  renderHistory() {
    if (this.props.value.plausibility !== true || this.props.passages.length === 0) return null;

    const self = this;
    let buttons = this.props.value.passages.map((p, i) => {
      if (p !== undefined && p !== 0 && this.props.value.selections[i].length === 0) {
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

  renderPassages() {
    if (this.props.value.plausibility !== true || this.props.passages.length === 0) return null;

    const currentPassage = this.props.passages[this.props.value.idx].passage_text;
    const passageValue = this.props.value.passages[this.props.value.idx];
    const selectionsValue = this.props.value.selections[this.props.value.idx];
    console.log(passageValue);
    console.log(selectionsValue);
    

    return (<tr>
      <td className="lead">
        Is the answer correct <i>according to</i> this paragraph?
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

  render() {
    const self = this;

    return (
      <Table className="QAPrompt">
        <tbody>
          <tr>
            <td width="25%" className="lead">For the question,</td>
            <td width="75%"><blockquote>{this.props.query}</blockquote></td>
          </tr>
          <tr>
            <td className="lead">
              Can you understand the question and is this a plausible answer to the question? <br/>
              <NaryAnswer
                options={PlausibilityOptions}
                value={this.props.value.plausibility}
                onValueChanged={resp => this.props.onValueChanged({plausibility:resp})}
              />
            </td>
            <td><blockquote>{this.props.answer}</blockquote></td>
          </tr>
          {this.renderPassages()}
          {this.renderHistory()}
        </tbody>
      </Table>);
  }
}

// Handles updating own value.
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

    let stateChange = {
      passages: {$splice: [[idx, 1, evidence]]},
    };

    // If evidence is +/- 1, don't advance.
    if (evidence === 0 || value.selections[idx].length > 0) {
      const nextIdx = value.passages.findIndex((v, i) => i !== idx && v === undefined);
      stateChange["idx"] = {$set: ((nextIdx === -1) ? idx : nextIdx)};
    }
    console.log(stateChange);
    return stateChange;
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
  value: {plausibility: undefined, passages: [undefined, undefined,], selections: [[],[]], idx: 0},
  onValueChanged: () => {},
  disabled: false,
}

export default QAPrompt;
