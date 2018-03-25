import React, { Component } from 'react';
import {FormGroup, ControlLabel, FormControl, Panel} from 'react-bootstrap';
import LikertGroup from './LikertGroup.js'
import {emojify} from 'react-emojione';

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
    <Panel header={<b>Give us feedback!</b>}>
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
    </Panel>
    );
  }
}

Feedback.defaultProps = {
  value: {},
  onChange: () => {}
}

export default Feedback;


// const questions = [
//   ["clarity", 
//       "How clear was the task?",
//       (<span>I've no idea what I'm doing {emojify(":disappointed:")}</span>),
//       (<span>{emojify(":thumbsup:")} Crystal clear</span>)],
//   ["fun", 
//     "How enjoyable was the task?",
//     (<span>I'd stop, I'm so bored {emojify(":sleeping:")}</span>),
//     (<span>{emojify(":dancer:")} Wheee!</span>)],
//   ["pay", 
//     "What do you think about the reward for this task?",
//     (<span>This is usury {emojify(":persevere:")}</span>),
//     (<span>{emojify(":moneybag:")} Much more than I thought!</span>),]
// ];
