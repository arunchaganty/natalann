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
    let seenAlready = this.props.version === undefined || this.props.version === version;
    return {show: !seenAlready};
  }

  open() {
    this.setState({show: true});
  }
  close() {
    this.setState({show: false});
    this.cookies.set("instructionsVersion", this.props.version);
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
  version: undefined,
  contents: "Fill in instructions here.",
  canHide: true,
}
Instructions.userVersion = function () {
  let cookies = new Cookies();
  return cookies.get("instructionsVersion");
}
Instructions.firstView = function (expectedVersion) {
  return Instructions.userVersion() !== expectedVersion;
}

export default Instructions;
