import React from 'react';

import update from 'immutability-helper';
import SegmentList from './SegmentList';
import SelectableDocument from './SelectableDocument.js';

/***
 * Renders a document within a div.
 */
class Document extends SelectableDocument {
  constructor(props) {
    super(props);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  // Get offset within current element.
  // The parent is either a h1 or a p.
  getSegmentOffset(node) {
    if (node.parentNode.nodeName === "SPAN") {
      node = node.parentNode;
    }

    // Ignore clicks which are outside the contents nodes.
    if (!(node.parentNode.nodeName === "P" || node.parentNode.nodeName === "H1"))
      return undefined;

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

  // Get which title/paragraph node is in.
  getSegmentIndex(node) {
    if (node.parentNode.nodeName === "SPAN") {
      node = node.parentNode;
    }

    // Ignore clicks which are outside the contents nodes.
    if (!(node.parentNode.nodeName === "P" || node.parentNode.nodeName === "H1"))
      return undefined;

    node = node.parentNode;

    let offset = 0;
    while (node.previousSibling !== null) {
      node = node.previousSibling;
      offset += 1;
    }
    return offset;
  }

  processClick(node) {
    if (node.nodeName === "SPAN") { // If you've clicked an existing span, then remove it.
      // Figure out which section this text is part of:
      let selection = [this.getSegmentOffset(node), this.getSegmentOffset(node) + node.textContent.length];
      let idx = this.getSegmentIndex(node);

      // Sometimes the ordering of a selection is wonky.
      if (selection[0] > selection[1]) {
        selection = [selection[1], selection[0]];
      }
      return {"remove": [idx, selection]};
    } else { // Ah, try to select the word.
      let selection = document.getSelection();
      console.assert(selection.isCollapsed);
      // anchorNode == extentNode
      let node = selection.anchorNode;
      let offset = this.getSegmentOffset(node) + selection.anchorOffset;
      let idx = this.getSegmentIndex(node);
      const doc = this.props.doc;

      let txt = (idx === 0) ? doc.title : doc.paragraphs[idx-1];
      if (txt[offset] === ' ') {
        return null; // Don't handle spaces.
      } 
      let segment = [
        (txt.lastIndexOf(' ', offset) === -1) ? 0 : txt.lastIndexOf(' ', offset)+1,
        (txt.indexOf(' ', offset) === -1) ? txt.length : txt.indexOf(' ', offset),
        1.0,
        ];

      return {"insert": [idx, segment]};
    }
  }

  handleMouseUp(evt) {
    if (evt.button === 0) {
      let update;
      let selection = document.getSelection();
      //if (this.props.mode === "select" && !selection.isCollapsed) {
      //  update = this.processSelection(selection);
      //  selection.collapseToEnd();
      //} else {
        selection.collapseToEnd();
        update = this.processClick(evt.target);
      //}

      if (update) {
        this.props.onValueChanged(update);
      }
    }
    return false;
  }

  renderDocument(doc, value) {
    console.assert(value.length === 1 + doc.paragraphs.length);

    let ret = [];
    ret.push(<h1 key={0}>{this.renderSelections(doc.title, value[0])} </h1>);
    for (let i = 0; i < doc.paragraphs.length; i++) {
      ret.push(<p key={i+1}>{this.renderSelections(doc.paragraphs[i], value[i+1])} </p>);
    }
    return ret;
  }

  render() {
    let spans = this.renderDocument(this.props.doc, this.props.value);
    return (
      <div className="SelectableDocument" id={this.props.id + "-contents"} onMouseUp={this.handleMouseUp} onContextMenu={this._handleContextMenu}>
        {spans}
      </div>
    );
  }
}

Document.initState = function(doc) {
  let ret = [];
  ret.push([]);
  for (let i = 0; i < doc.paragraphs.length; i++) {
    ret.push([]);
  }

  return ret;
}

Document.updateState = function(state, value) {
  if (value.insert) {
    let [idx, selection] = value.insert
    return update(state, {$splice: [[idx, 1, SegmentList.insert(state[idx], selection)]]});
  } else if (value.remove) {
    let [idx, selection] = value.remove
    return update(state, {$splice: [[idx, 1, SegmentList.remove(state[idx], selection)]]});
  }
}

Document.defaultProps = {
  id: "#document",
  value: [[],[],[],[]], //[[10,20], [35,40]],
  doc: {title: "This is a title",
        paragraphs: ["Paragraph 1", "Paragraph 2", "Paragraph 3"],
  },
  onValueChanged: () => {},
  mode: "click",
  highlightType: "warning",
}

export default Document;
