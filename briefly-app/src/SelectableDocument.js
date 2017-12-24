import React, { Component } from 'react';
import './Document.css';
import { Panel } from 'react-bootstrap';

/***
 * Renders a document within a div.
 */
class Document extends Component {
  constructor(props) {
    super(props);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.selections !== nextProps.selections);
  }

  getSegmentOffset(node) {
    if (node.parentNode.nodeName === "SPAN") {
      node = node.parentNode;
    }

    console.assert(node.parentNode !== undefined);
    console.assert(node.parentNode.id === "document-contents");

    let offset = 0;
    while (node.previousSibling !== null) {
      node = node.previousSibling;
      if (node.nodeType === Node.ELEMENT_NODE) {
        offset += node.textContent.length;
      } else if (node.nodeType === Node.TEXT_NODE) {
        offset += node.textContent.length;
      } else if (node.nodeType === Node.COMMENT_NODE) {
      } else {
        console.warn("Did not expect to see node: ", node);
      }
    }
    return offset;
  }

  processSelection(node) {
    let selection = [
      this.getSegmentOffset(node.anchorNode) + node.anchorOffset,
      this.getSegmentOffset(node.focusNode) + node.focusOffset];

    // Sometimes the ordering of a selection is wonky.
    if (selection[0] > selection[1]) {
      selection = [selection[1], selection[0]];
    }
    return {"insert": selection};
  }

  processClick(node) {
    if (node.nodeName === "SPAN") { // If you've clicked an existing span, then remove it.
      // Figure out which section this text is part of:
      let selection = [this.getSegmentOffset(node), this.getSegmentOffset(node) + node.textContent.length];

      // Sometimes the ordering of a selection is wonky.
      if (selection[0] > selection[1]) {
        selection = [selection[1], selection[0]];
      }
      return {"remove": selection};
    } else { // Ah, try to select the word.
      let selection = document.getSelection();
      console.assert(selection.isCollapsed);
      let node = selection.anchorNode;
      let offset = this.getSegmentOffset(node) + selection.anchorOffset;

      let txt = this.props.text;
      if (txt[offset] === ' ') {
        return null; // Don't handle spaces.
      } 
      let segment = [
        (txt.lastIndexOf(' ', offset) === -1) ? 0 : txt.lastIndexOf(' ', offset)+1,
        (txt.indexOf(' ', offset) === -1) ? txt.length : txt.indexOf(' ', offset)
        ];

      return {"insert": segment};
    }
    return {};
  }

  _handleContextMenu(evt) {
    evt.preventDefault();
    return false;
  }

  handleMouseUp(evt) {
    console.log(this.props.selections);
    if (evt.button === 0) {
      let update;
      let selection = document.getSelection();
      if (this.props.mode === "select" && !selection.isCollapsed) {
        update = this.processSelection(selection);
        selection.collapseToEnd();
      } else {
        selection.collapseToEnd();
        update = this.processClick(evt.target);
      }

      if (update) {
        this.props.onSelectionChanged(update);
      }
    }
    return false;
  }

  renderSelections(txt, selections) {
    let children = [];
    let idx = 0;
    for (let i = 0; i < selections.length; i++) {
      let [start, end] = selections[i];

      if (idx < start) children.push(txt.substring(idx, start));

      children.push(<span className="error" key={i}>{txt.substring(start, end)}</span>);

      idx = end;
    }
    if (idx < txt.length) children.push(txt.substring(idx, txt.length));
    return children;
  }

  render() {
    let title = (<h3><b>{this.props.title}</b></h3>);
    let spans = this.renderSelections(this.props.text, this.props.selections);

    return (
      <Panel className="document" id={this.props.id} header={title} bsStyle={this.props.bsStyle}>
        <div id="document-contents" onMouseUp={this.handleMouseUp} onContextMenu={this._handleContextMenu}>
        {spans}
        </div>
      </Panel>
    );
  }
}
Document.defaultProps = {
  id: "#document",
  title: "",
  selections: [],
  text: "America in in Hirsi somali-born the 45 after threats Netherlands emigrated facing Ali death . to 2006 , , member faith been She had for after renouncing and and her an parliament . target a a extremists of becoming atheist championed that that in in Hirsi has said as the the the the the the the best world and Ali fact . country law law U.S. U.S.",
  onSelectionChanged: () => {},
  //mode: "click",
  mode: "select",
  bsStyle: undefined,
}

export default Document;