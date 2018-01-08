import React, { Component } from 'react';
import {Button, ButtonGroup, Glyphicon} from 'react-bootstrap';

class BinaryAnswer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ButtonGroup>
        <Button 
            bsStyle="success" 
            active={this.props.selected === true}
            onClick={this.props.onValueChanged(this, true)}
            disabled={this.props.disabled}
        ><Glyphicon glyph="ok"/></Button>
        <Button 
            bsStyle="danger" 
            active={this.props.selected === false}
            onClick={this.props.onValueChanged(this, false)}
            disabled={this.props.disabled}
        ><Glyphicon glyph="remove"/></Button>
      </ButtonGroup>
    );
  }
}

BinaryAnswer.defaultProps = {
  value: undefined,
  onValueChanged: () => {},
  disabled: false,
}

export default BinaryAnswer;
