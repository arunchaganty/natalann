import React, { Component } from 'react';
import './EditableDocument.css';
import { Panel } from 'react-bootstrap';
import ContentEditable from './ContentEditable.js'

/***
 * Renders a document within a div.
 */
class EditableDocument extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let title = (<h3><b>{this.props.title}</b></h3>);
    return (
      <Panel className="document" id={this.props.id} header={title}>
        <ContentEditable className="document-contents" html={this.props.text} onChange={this.props.onTextChange} editable={this.props.editable}/>
      </Panel>
    );
  }
}
EditableDocument.defaultProps = {
    id: "#kdit-document",
    title: "",
    text: "",
    editable: true,
    onTextChange: () => {},
  }

export default EditableDocument;
