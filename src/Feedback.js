import React, { Component } from 'react';
import {FormGroup, ControlLabel, FormControl, Panel} from 'react-bootstrap';
import LikertGroup from './LikertGroup.js'

class Feedback extends Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.value !== this.props.value;
  }

  render() {
    const questions = [
      ["clarity", 
          "How clear was the task?",
          "Not at all",
          "Perfectly"],
      ["fun", 
        "How enjoyable was the task?",
        "Not at all",
        "Whee!"],
      ["pay", 
        "What do you think about the reward for this task?",
        "Very bad",
        "Very good",]
    ];

    return (
    <Panel>
      <Panel.Heading><Panel.Title><b>Give us feedback!</b></Panel.Title></Panel.Heading>
      <Panel.Body>
      <LikertGroup name="feedback" questions={questions} value={this.props.value} onChange={this.props.onChange} />
      <br />

      <FormGroup controlId="feedback-comments">
      <ControlLabel>Suggestions/Comments</ControlLabel> 
      <FormControl
        name="feedback-comments"
        componentClass="textarea"
        value={this.props.value.comments}
        onChange={(evt) => this.props.onChange({comments: evt.target.value})}
        placeholder="Please do let us know if you have any comments or suggestions about the task so that we can improve it!"
      />
      </FormGroup>
      </Panel.Body>
    </Panel>
    );
  }
}

Feedback.defaultProps = {
  value: {},
  onChange: () => {}
}

export default Feedback;
