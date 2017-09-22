import React, { Component } from 'react';
import { Link, Route, Switch } from 'react-router-dom';
import { ListGroup, ListGroupItem, Panel } from 'react-bootstrap';

import RoutingButton from './RoutingButton';
import AttentionApp from './AttentionApp';
import EditingApp from './EditingApp';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <RoutingButton />
        <Switch>
        <Route path="/attention/:path+" component={AttentionApp} />
        <Route path="/editing/:path+" component={EditingApp} />
        </Switch>
      </div>
      );
  }
}

export default App;
