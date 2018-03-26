import React, { Component } from 'react';
import './EditableDocument.css';
import {Glyphicon, Button } from 'react-bootstrap';
import ContentEditable from './ContentEditable.js'

/***
 * Renders a document within a div.
 */
class EditableDocument extends Component {
  render() {
    return (
      <div className="EditableDocument">
        <ContentEditable className="document-contents" html={this.props.value} onChange={evt => this.props.onValueChanged(evt.target.value)} editable={this.props.editable}/>
        
        <div className="pull-right">
        <Button bsStyle="warning" onClick={() => this.props.onValueChanged(this.props.text)}>
            <Glyphicon glyph="fast-backward" /> Reset
        </Button>
        </div>
        <div className="clearfix"></div>
      </div>
    );
  }
}
EditableDocument.defaultProps = {
    id: "#edit-document",
    text: "",
    value: "",
    editable: true,
    onValueChanged: () => {},
  }

export default EditableDocument;
