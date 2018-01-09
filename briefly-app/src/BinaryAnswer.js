import React, { Component } from 'react';
import {Button, ButtonGroup, Glyphicon} from 'react-bootstrap';

class BinaryAnswer extends Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.value !== nextProps.value);
  }

  render() {
    return (
      <ButtonGroup>
        <Button 
            bsStyle="success" 
            active={this.props.value === true}
            onClick={() => {this.props.value !== true && this.props.onValueChanged(true)}}
            disabled={this.props.disabled}
        ><Glyphicon glyph="ok"/></Button>
        <Button 
            bsStyle="danger" 
            active={this.props.value === false}
            onClick={() => {this.props.value !== false && this.props.onValueChanged(false)}}
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
