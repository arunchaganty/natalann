import React, { Component } from 'react';
import { Panel, Button, Glyphicon } from 'react-bootstrap';

class InformationComponent extends Component {
  render() {
    let done = true;
    let submitButton = (done) ?  (
      <Button bsSize="large" bsStyle="success"><Glyphicon glyph="ok" /> Submit</Button>
      ) : ""; 
    return (
      <Panel> 
      <h4>Reward ({this.props.wordCount} words): <small>{this.props.reward}</small></h4>
      <h4>Estimated time: <small>{this.props.estimatedTime}</small></h4>
      <div className="flexbox">
        <Button bsSize="large"><Glyphicon glyph="info-sign" /> Instructions</Button>
        {submitButton}
      </div>
      </Panel>
    );
  }
}

export default InformationComponent;
