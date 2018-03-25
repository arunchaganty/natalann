import React, { Component } from 'react';
import { Link, Route, Switch } from 'react-router-dom';
import { ListGroup, ListGroupItem, Panel, Tabs, Tab } from 'react-bootstrap';

import './RoutingButton.css';
import FileList from './FileList';

class RoutingButton extends Component {

  constructor(props) {
    super(props);

    this.state = {
      "toggled": false,
    };

    this.toggle = this.toggle.bind(this);
  }

  toggle(evt) {
    this.setState(state => { return {"toggled": !state.toggled}; });
  }

  renderButton() {
    return (
      <div className="round-button" onClick={this.toggle} />
    );
  }

  renderView() {
    if (this.state.toggled) {
      return (
        <Panel header={<b>Pick a datum</b>} className="routing-list">
        <Tabs id="file-select">
          <Tab eventKey={1} title="Attention"><FileList root="/attention/" /></Tab>
          <Tab eventKey={2} title="Editing"><FileList root="/editing/" /></Tab>
          <Tab eventKey={3} title="Editing View"><FileList root="/editing-view/" /></Tab>
        </Tabs>
        </Panel>
      );
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className="routing-button">
       {this.renderButton()}
       {this.renderView()}
      </div>
    );
  }
}

export default RoutingButton;
