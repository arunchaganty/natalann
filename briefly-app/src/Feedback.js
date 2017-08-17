import React, { Component } from 'react';
import {FormGroup, ControlLabel, FormControl, Panel} from 'react-bootstrap';
import Likert from './Likert.js'
import {emojify} from 'react-emojione';

class Feedback extends Component {
  render() {
    return (
    <Panel header={<b>Give us feedback!</b>}>
      <table width="100%">
        <thead><tr><th></th><th width="10%"></th><th></th></tr></thead>
        <tbody>
        <tr>
          <td> How clear was the task?  </td>
          <td></td>
          <td>
            <Likert name="feedback-clarity" min={<span>I've no idea what I'm doing {emojify(":disappointed:")}</span>} max={<span>{emojify(":thumbsup:")} Crystal clear</span>} scale={5} />
          </td>
        </tr>
        <tr>
          <td>How enjoyable was the task?</td>
          <td></td>
          <td>
            <Likert name="feedback-fun" min={<span>I'd stop, I'm so bored {emojify(":sleeping:")}</span>} max={<span>{emojify(":dancer:")} Wheee!</span>} scale={5} />
          </td>
        </tr>

        <tr>
          <td>What do you think about the reward for this task?</td>
          <td></td>
          <td>
            <Likert name="feedback-pay" min={<span>This is usury {emojify(":persevere:")}</span>} max={<span>{emojify(":moneybag:")} Much more than I thought!</span>} scale={5} />
          </td>
        </tr>
        </tbody>
      </table>

      <FormGroup controlId="feedback-comments">
      <ControlLabel>Suggestions/Comments</ControlLabel> 
      <FormControl name="feedback-comments" componentClass="textarea" placeholder="Please do let us know if you have any comments or suggestions about the task so that we can improve it!" />
      </FormGroup>
    </Panel>
    );
  }
}

export default Feedback;
