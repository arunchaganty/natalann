import React, { Component } from 'react';
import { Panel } from 'react-bootstrap';

import update from 'immutability-helper';
import SegmentList from './SegmentList';

import './SelectableDocument.css';

/***
 * Renders a document within a div.
 */
class Document extends Component {
  constructor(props) {
    super(props);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return Object.entries(this.props).some((k,v) => !Object.is(v, nextProps[k]));
  }

  getSegmentOffset(node) {
    if (node.parentNode.nodeName === "SPAN") {
      node = node.parentNode;
    }

    // Ignore clicks which are outside the contents nodes.
    if (node.parentNode === undefined || node.parentNode.id !== this.props.id+"-contents")
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

  processSelection(node) {
    let selection = [
      this.getSegmentOffset(node.anchorNode) + node.anchorOffset,
      this.getSegmentOffset(node.focusNode) + node.focusOffset];
    if (Number.isNaN(selection[0]) || Number.isNaN(selection[1])) {
      return;
    }

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
  }

  _handleContextMenu(evt) {
    evt.preventDefault();
    return false;
  }

  handleMouseUp(evt) {
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
        this.props.onValueChanged(update);
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

      children.push(<span className={this.props.highlightType} key={i}>{txt.substring(start, end)}</span>);

      idx = end;
    }
    if (idx < txt.length) children.push(txt.substring(idx, txt.length));
    return children;
  }

  render() {
    let spans = this.renderSelections(this.props.text, this.props.selections);
    return (
      <div className="SelectableDocument" id={this.props.id + "-contents"} onMouseUp={this.handleMouseUp} onContextMenu={this._handleContextMenu}>
        {spans}
      </div>
    );
  }
}

Document.updateState = function(state, value) {
  if (value.insert) {
    return SegmentList.insert(state, value.insert);
  } else if (value.remove) {
    return SegmentList.remove(state, value.remove);
  }
}

Document.defaultProps = {
  id: "#document",
  selections: [], //[[10,20], [35,40]],
  text: "America in in Hirsi somali-born the 45 after threats Netherlands emigrated facing Ali death . to 2006 , , member faith been She had for after renouncing and and her an parliament . target a a extremists of becoming atheist championed that that in in Hirsi has said as the the the the the the the best world and Ali fact . country law law U.S. U.S.",
  onValueChanged: () => {},
  //mode: "click",
  mode: "select",
  highlightType: "warning",
}

export default Document;
