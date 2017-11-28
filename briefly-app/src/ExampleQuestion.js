import React, { Component } from 'react';
import {Alert, Panel, Glyphicon} from 'react-bootstrap';
import LikertGroup from './LikertGroup';

// A likert scale.
class ExampleQuestion extends Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.value !== this.props.value;
  }
  constructor(props) {
    super(props)
  }

  render() {
    const value = this.props.value && this.props.value[this.props.name];
    let questionStatus = "bg-warning";
    let alert = undefined;
    let glyph = <Glyphicon glyph="question-sign" />;
    if (value !== undefined) {
      if (this.props.expected === value) {
        questionStatus =  "bg-success";
        alert = <Alert bsStyle="success">{this.props.explanation}</Alert>
        glyph = <Glyphicon glyph="ok-sign" />;
      } else {
        questionStatus =  "bg-danger";
        alert = <Alert bsStyle="warning">Hmm... we think it's {(this.props.expected < value) ? "lower" : "higher"} than that.</Alert>
        glyph = <Glyphicon glyph="remove-sign" />;
      }
    }

    return (<Panel>
      <blockquote>{glyph} {this.props.prompt}</blockquote>
      <LikertGroup
        questions={[[this.props.name, this.props.question]]}
        scale={this.props.scale}
        value={this.props.value}
        onChange={this.props.onChange}
      />
      {alert}
    </Panel>);
  }
}

ExampleQuestion.defaultProps = {
  "prompt": "This is the best question.",
  "question": "How good is this question?",
  "scale": 5,
  "expected": 4,
  "explanation": "It just is.",
  "value": undefined,
  "onChange": (value) => {},
  "name": "example-question",
}

export default ExampleQuestion;
