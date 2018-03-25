import React, { Component } from 'react';
import {Panel, Glyphicon, Form, FormGroup, ToggleButton, ToggleButtonGroup, Col, ControlLabel} from 'react-bootstrap';

import './QuestionGroup.css'

// Represents a dynamic question group.
class QuestionGroup extends Component {

  render() {
    let elems = this.props.questions.map((q,i) => (
      <FormGroup className="question-group" controlId={"question-"+i} key={i}>
          <Col componentClass={ControlLabel} sm={8}>
            {q}
          </Col>
          <Col sm={4}>
            <ToggleButtonGroup name={"question-"+i} type="radio" 
                value={this.props.responses[i]}
                onChange={(value) => this.props.onChange({target: i, question:q, value:value})}
                >
              <ToggleButton value={true} bsStyle="success"><Glyphicon glyph="ok"/> Yes</ToggleButton>
              <ToggleButton value={false} bsStyle="warning"><Glyphicon glyph="remove"/> No</ToggleButton>
            </ToggleButtonGroup>
          </Col>
      </FormGroup>)
    );

    return <Panel header={<b>{this.props.title}</b>}>{elems}</Panel>;
  }
}

QuestionGroup.defaultProps = {
  title: "Questions",
  questions: [],
  responses: [],
  onChange: () => {},
}

export default QuestionGroup;
