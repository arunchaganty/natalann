import React, { Component } from 'react';
import {Alert, Button, ButtonGroup, Glyphicon, Table} from 'react-bootstrap';
import NaryAnswer from './NaryAnswer';
import SelectableDocument from './SelectableDocument';
import update from 'immutability-helper';

import './RatingWidget.css';

function _kv(key, value) {
  let ret = {};
  ret[key] = value;
  return ret;
}

const QUESTIONS = [
  ["grammar", {
    prompt: "Is the above paragraph fluent?",
    highlightPrompt: "Please highlight any portions of the text that seem ungrammatical.",
    action: "select",
    options: [{
        style: "success",
        glyph: "ok",
        tooltip: "It reads as fluently as something you might read in a newspaper.",
        value: 1,
        needsHighlight: false,
      },{
        style: "warning",
        glyph: "minus",
        tooltip: "It has errors, but you can mostly understand it.",
        value: 0,
        needsHighlight: true,
      },{
        style: "danger",
        glyph: "remove",
        tooltip: "You can hardly understand it at all.",
        value: -1,
        needsHighlight: true,
      },
    ],
  }],
  ["redundancy", {
    prompt: "Does the above paragraph contain very little nor no redunant content?",
    highlightPrompt: "Please highlight any redundant portions of the text.",
    action: "pair-select",
    options: [{
        style: "success",
        glyph: "ok",
        tooltip: "There is no or very little repeated content.",
        value: 1,
        needsHighlight: false,
      },{
        style: "warning",
        glyph: "minus",
        tooltip: "There are only some repetitive portions (e.g. reusing proper nouns) that could be improved.",
        value: 0,
        needsHighlight: true,
      },{
        style: "danger",
        glyph: "remove",
        tooltip: "There are significant portions that are repeated.",
        value: -1,
        needsHighlight: true,
      },
    ],
  }],
  ["focus", {
    prompt: "Does the above paragraph have a clear focus?",
    highlightPrompt: "Please highlight the points (e.g. people, organizations, events, etc.) of focus.",
    action: "select",
    options: [{
        style: "success",
        glyph: "ok",
        tooltip: "There is a single clear object of focus.",
        value: 1,
        needsHighlight: true,
      },{
        style: "warning",
        glyph: "minus",
        tooltip: "There are a few, mostly clear, objects of focus.",
        value: 0,
        needsHighlight: true,
      },{
        style: "danger",
        glyph: "remove",
        tooltip: "There is no clearly discernable object of focus.",
        value: -1,
        needsHighlight: false,
      },
    ],
  }],
  ["clarity", {
    prompt: "Is it clear who/what are mentioned in the above paragraph?",
    highlightPrompt: "Please highlight the people/organizations/events/etc. that are unclear.",
    action: "select",
    options: [{
        style: "success",
        glyph: "ok",
        tooltip: "All mentions of people/places are clearly defined.",
        value: 1,
        needsHighlight: false,
      },{
        style: "warning",
        glyph: "minus",
        tooltip: "Most mentions of people/places are clearly defined.",
        value: 0,
        needsHighlight: true,
      },{
        style: "danger",
        glyph: "remove",
        tooltip: "Most mentions of people/places are *not* clearly defined.",
        value: -1,
        needsHighlight: true,
      },
    ],
  }],
  ["overall", {
    prompt: "Overall, rate the quality of the paragraph.",
    options: [{
        style: "success",
        glyph: "thumbs-up",
        tooltip: "It's good! :)",
        value: 1,
        needsHighlight: false,
      },{
        style: "warning",
        glyph: "hand-right",
        tooltip: "It's ok :-/.",
        value: 0,
        needsHighlight: false,
      },{
        style: "danger",
        glyph: "thumbs-down",
        tooltip: "It's bad :-(",
        value: -1,
        needsHighlight: false,
      },
    ],
  }],
];

const STYLES = new Map([
  [1, "success"],
  [0, "success"],
  [-1, "success"],
  ["alert", "default"],
  ["active", "active"],
  ["incomplete", "default"],
  ["needs-highlight", "warning"],
  ["complete", "success"],
]);
const GLYPHS = new Map([
  [1, "ok-sign"],
  [0, "minus-sign"],
  [-1, "remove-sign"],
  ["alert", "exclamation-sign"],
  ["active", "pencil"],
  ["incomplete", "star-empty"],
  ["needs-highlight", "exclamation-sign"],
  ["complete", "star"],
]);

class Widget extends Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.value !== nextProps.value) || (this.props.state !== nextState);
  }

  static initValue() {
    return {
      ratings: {grammar: undefined, redundancy: undefined, clarity: undefined, focus: undefined,},
      selections: {grammar: [], redundancy: [], clarity: [], focus: []},
      idx: 0,
    };
  }

  static _getStatus(value, question) {
    let options = QUESTIONS.find(v => v[0] === question)[1];

    if (value.ratings[question] === undefined) return "incomplete";
    if (options.options.find(o => o.value === value.ratings[question]).needsHighlight
        && value.selections[question].length === 0) return "needs-highlight";

    return "complete";
  }

  static isComplete(value) {
    return QUESTIONS.every(q => Widget._getStatus(value, q[0]) === "complete");
  }

  // Handles updating own value.
  static handleValueChanged(value, valueChange) {
    if (valueChange.ratings) {
      let [question, valueChange_] = valueChange.ratings;
      value = update(value, {ratings: {$merge: _kv(question, valueChange_)}});
      status = Widget._getStatus(value, question);

      let nextIdx = QUESTIONS.findIndex(q => Widget._getStatus(value,  q[0]) !== "complete");
      if (status === "complete" && nextIdx !== -1) {
        return {ratings: {$set: value.ratings}, idx: {$set: nextIdx}};
      } else {
        return {ratings: {$set: value.ratings}};
      }
    }
    if (valueChange.selections) {
      let [question, valueChange_] = valueChange.selections;
      valueChange_ = SelectableDocument.updateState(value.selections[question], valueChange_);
      return {selections: {$merge: _kv(question, valueChange_)}};
    }
    if (valueChange.idx !== undefined) {
      return {idx: {$set: valueChange.idx}};
    }
    console.warn("Unexpected valueChange ", valueChange);
    return {$set: value};
  }

  renderRows() {
    const value = this.props.value;
    let rows = QUESTIONS.map(([question, options], i) => {
      let status =  Widget._getStatus(value, question);
      let isActive = (i === value.idx);
      let disabled = !isActive;

      let prompt = isActive ? <b>{options.prompt}</b> : options.prompt;
      let classStyle = (status === "needs-highlight") ? "warning" 
                      :(status === "complete") ? "success"
                      :(isActive) ? "active" : "";
      let glyph = (status === "complete") ? GLYPHS.get(value.ratings[question])
                  : GLYPHS.get(status);

      return (<tr key={question} className={classStyle}>
        <td><Glyphicon glyph={glyph} /></td>
        <td  onClick={() => this.props.onValueChanged({idx: i})}> {prompt} </td>
        <td>
          <NaryAnswer
          options={options.options}
          disabled={disabled}
          value={value.ratings[question]}
          onValueChanged={value => this.props.onValueChanged({ratings: [question, value]})}
        />
        </td>
        </tr>);
    });

    return rows;
  }

  render() {
    let value = this.props.value;
    let [question, options] = QUESTIONS[value.idx];
    let status = Widget._getStatus(value, question);

    let alert;
    if (options.highlightPrompt) {
      alert = (<Alert bsStyle={status === "needs-highlight" ? "warning" : "info"}>
            <b>{options.highlightPrompt}</b>
          </Alert>);
    }

    return (<div className="RatingWidget">
          {alert}

          <SelectableDocument 
              text={this.props.text}
              selections={this.props.value.selections[question]}
              onValueChanged={value => this.props.onValueChanged({selections: [question, value]})}
              editable={this.props.editable}
              /> 
          <hr />
          <Table>
            <thead>
              <tr>
                <th width="5%"></th>
                <th width="75%">Question</th>
                <th width="20%">Response</th>
              </tr>
            </thead>
            <tbody>
              {this.renderRows()}
            </tbody>
          </Table>
        </div>);
  }
}

// top 3 are givens,
// value is actually 'state'.
Widget.defaultProps = {
  text: "The group votes at the meeting to adopt a ban as an official policy . The group is banning the use of the term `` drug '' for the chemicals used.",
  value: Widget.initValue(),
  onValueChanged: () => {},
  editable: false,
}

export default Widget;
