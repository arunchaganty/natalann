import React, { Component } from 'react';
import './Document.css';
import { Panel } from 'react-bootstrap';

/***
 * Renders a document within a div.
 */
class Document extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let title = (<h3><b>{this.props.title}</b></h3>);
    return (
      <Panel className="document" id={this.props.id} header={title} bsStyle={this.props.bsStyle}>
        <div id="document-contents">
          {this.props.text}
        </div>
      </Panel>
    );
  }
}
Document.defaultProps = {
  id: "#document",
  title: "",
  text: "",
  bsStyle: undefined,
}

export default Document;
