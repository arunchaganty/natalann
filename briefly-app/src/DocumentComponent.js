import React, { Component } from 'react';
//import './Document.css';
import { Panel } from 'react-bootstrap';

/***
 * Renders a document within a div.
 */
class DocumentComponent extends Component {
  // Selections contains character offsets corresponding to selected
  // spans in the document. 
  state = {
    "selections": [],
  }

  mouseUpHandler(evt) {
    let sel = document.getSelection();
    if (sel.isCollapsed) return;

    console.log(sel);
    // Each selection corresponds to a span of parent elements and span
    // across the is identified potentially by its child index and
    // offset.

    // To unselect, we add a negative element to the selection range.
  }

  render() {
    let title = (<h3><b>{this.props.title}</b></h3>);
    // Actually compose the document by chaining together DOM
    // elements and highlights. 

    return (
      <Panel header={title} onMouseUp={this.mouseUpHandler}> 
        {this.props.contents}
      </Panel>
    );
  }
}

export default DocumentComponent;
