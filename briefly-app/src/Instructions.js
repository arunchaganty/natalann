import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import {Button, Glyphicon, Modal} from 'react-bootstrap';
import './Instructions.css';

class Instructions extends Component {
  constructor(props) {
    super(props);
    this.cookies = new Cookies();
    this.state = this.initState(props);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }
  initState(props) {
    let version = this.cookies.get("instructionsVersion");
    let seenAlready = false || (this.props.version === version);
    if (seenAlready) {
      return {"show": false};
    } else {
      return {"show": true};
    }
  }

  open() {
    this.setState({"show": true});
  }
  close() {
    this.setState({"show": false});
    this.cookies.set("instructionsVersion", process.env.VERSION);
  }

  render() {
    let button;
    if (this.props.canHide) {
      button = <Button bsSize="large" bsStyle="success" onClick={this.close}>Done!</Button>
    } else {
      button = <Button bsSize="large" bsStyle="warning" disabled>Please complete the quiz above before proceeding.</Button>
    }
    return (<div>
      <Button bsSize="large" bsStyle="primary" onClick={this.open}><Glyphicon glyph="info-sign" /> Instructions</Button>
      <Modal bsSize="large" 
          show={this.state.show}
          onHide={this.close}
          onEntering={this.props.onEntering}
          onExiting={this.props.onExiting}
          backdrop={this.props.canHide ? true : 'static'}
          keyboard={this.props.canHide}>
        <Modal.Header><Modal.Title>Instructions</Modal.Title></Modal.Header>
        <Modal.Body> {this.props.contents} </Modal.Body>
        <Modal.Footer> {button} </Modal.Footer>
      </Modal>
      </div>);
  }
}
Instructions.defaultProps = {
  version: '',
  contents: "Fill in instructions here.",
  canHide: true,
}
Instructions.firstView = function (props) {
  let cookies = new Cookies();
  let version = cookies.get("instructionsVersion");
  return version !== props.instructionsVersion;
}

export default Instructions;
