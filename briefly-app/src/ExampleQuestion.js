import React, { Component } from 'react';
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
    let questionStatus = "bg-warning";
    if (this.props.value !== undefined && this.props.value[this.props.name] !== undefined) {
      questionStatus = (this.props.expected == this.props.value[this.props.name]) ? "bg-success" : "bg-danger";
    }
    // TODO: include a prompt saying "expect higher/lower".

    return (<div className={questionStatus}>
      <blockquote>{this.props.prompt}</blockquote>
      <LikertGroup
        questions={[[this.props.name, this.props.question]]}
        scale={this.props.scale}
        value={this.props.value}
        onChange={this.props.onChange}
      />

    </div>);
  }
}

ExampleQuestion.defaultProps = {
  "prompt": "This is the best question.",
  "question": "How good is this question?",
  "scale": 5,
  "expected": 4,
  "value": undefined,
  "onChange": (value) => {},
  "name": "example-question",
}

export default ExampleQuestion;
