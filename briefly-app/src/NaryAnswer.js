import React, { Component } from 'react';
import {Button, ButtonGroup, Glyphicon, OverlayTrigger, Tooltip} from 'react-bootstrap';

class NaryAnswer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const self = this;
    let buttons = this.props.options.map((obj,i) => 
      <OverlayTrigger key={i} placement="top" overlay={(<Tooltip id={'tooltip-'+i}>{obj.tooltip}</Tooltip>)}>
        <Button 
            bsStyle={obj.style}
            active={self.props.value === obj.value}
            onClick={() => {self.props.value !== obj.value && self.props.onValueChanged(obj.value)}}
            disabled={self.props.disabled}
        ><Glyphicon glyph={obj.glyph}/></Button>
      </OverlayTrigger>);

    return (
      <ButtonGroup>
        {buttons}
      </ButtonGroup>
    );
  }
}

NaryAnswer.defaultProps = {
  options: [{
    style: "success",
    glyph: "ok",
    tooltip: "The answer is correct according to this passage.",
    value: 1},{
    style: "warning",
    glyph: "minus",
    tooltip: "The passage doesn't help answer the question",
    value: 0},{
    style: "danger",
    glyph: "remove",
    tooltip: "The answer is incorrect according to this passage.",
    value: -1}],
  value: undefined,
  onValueChanged: () => {},
  disabled: false,
}

export default NaryAnswer;
