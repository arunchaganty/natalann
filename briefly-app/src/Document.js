import React, { Component } from 'react';
import './Document.css';
import { Panel } from 'react-bootstrap';

/***
 * Renders a document within a div.
 */
class Document extends Component {
  defaultProps = {
    id: "#document",
    title: "",
    contents: {title: "", paragraphs: []},
  }

  constructor(props) {
    super(props);
    this.state = {
      "selections": [],
    }

    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  // Selections contains character offsets corresponding to selected
  // spans in the document. 
  componentWillReceiveProps(nextProps) {
    console.warn("Changing contents needs us to flush out all selections.");
    this.setState({
      "selections": [],
    });
  }

  insertSelection(sel) {

  }

  removeSelection(sel) {

  }

  // Identifies a node by its path in the DOM tree, rooted at 
  // 
  getNodePath(node) {
    // TODO: ignore highlight spans
    let path = []
    while (node.id !== this.props.id && node.parentElement !== null) {
      let siblingIndex = 0;
      while (node.previousSibling !== null) {
        node = node.previousSibling;
        siblingIndex++;
      }
      path.push(siblingIndex);
      node = node.parentElement;
    }

    return path;
  }

  handleMouseUp(evt) {
    let sel = document.getSelection();
    if (sel.isCollapsed) return;

    console.log(sel);
    // Each selection corresponds to a span of parent elements and span
    // across the is identified potentially by its child index and
    // offset.
    let start = this.getNodePath(sel.anchorNode);
    start.push(sel.anchorOffset);
    let end = this.getNodePath(sel.focusNode);
    end.push(sel.focusOffset);

    console.log(start);
    console.log(end);

    // To unselect, we add a negative element to the selection range.
  }

  render() {
    let title = (<h3><b>{this.props.title}</b></h3>);
    // Actually compose the document by chaining together DOM
    // elements and highlights. 
    //
    console.log(this.dom);
    console.log(this.props.contents);
    
    // Make input a DOM element.
    let dom = "";

    return (
      <Panel id={this.props.id} header={title} onMouseUp={this.handleMouseUp}> 
        {dom}
      </Panel>
    );
  }
}

export default Document;
