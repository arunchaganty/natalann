import React, { Component } from 'react';
import { Link, Route, Switch } from 'react-router-dom';
import { ListGroup, ListGroupItem, Panel, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';

class FileList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      "listing": {type:"directory", name:"", children:[]},
    }
  }

  // Handle a single nesting.
  componentDidMount() {
    axios.get('/list-files')
      .then(res => {
        this.setState({"listing": res.data});
      });
  }

  renderList(dir) {
    console.assert(dir.type === "directory");
    let elems = dir.children.map(child => {
      if (child.type === "directory") {
        return <li key={child.name}>{child.name} {this.renderList(child)}</li>;
      } else {
        return <li key={child.name}><Link to={"/attention/"+child.name}>{child.name}</Link></li>;
      }
    });

    return <ul>{elems}</ul>;
  }

  render() {
    return this.renderList(this.state.listing);
  }
}

export default FileList;
