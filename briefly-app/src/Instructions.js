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
    //let seenAlready = this.cookies.get("seenInstructions");
    let seenAlready = false;
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
    this.cookies.set("seenInstructions", true);
  }

  render() {
   return (<div>
      <Button bsSize="large" bsStyle="primary" onClick={this.open}><Glyphicon glyph="info-sign" /> Instructions</Button>
     <Modal bsSize="large" show={this.state.show} onHide={this.close} backdrop={this.props.canHide} keyboard={this.props.canHide}>
      <Modal.Header><Modal.Title>Instructions</Modal.Title></Modal.Header>
      <Modal.Body> {this.props.contents} </Modal.Body>
     </Modal>
   </div>);
  }


}
export default Instructions;
