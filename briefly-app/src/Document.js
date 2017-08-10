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

  merge(a, b) {
    let ret = [];
    let ai = 0;
    let bi = 0;
    while (ai < a.length && bi < b.length) {
      if (a[ai] < b[bi]) {
        ret.push(a[ai++]);
      } else {
        ret.push(b[bi++]);
      }
    }
    while (ai < a.length) {
      ret.push(a[ai++]);
    }
    while (bi < b.length) {
      ret.push(b[bi++]);
    }

    return ret;
  }

  constructor(props) {
    super(props);
    this.state = this.initState(props);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  initState(props) {
    let ret = {
      "selections": [],
      "lengths": [],
    }

    ret.selections.push([]);
    ret.lengths.push(props.contents.title.length);
    for (let i = 0; i < props.contents.paragraphs.length; i++) {
      ret.selections.push([]);
      ret.lengths.push(props.contents.paragraphs[i].length);
    }
    return ret;
  }

  // Selections contains character offsets corresponding to selected
  // spans in the document. 
  componentWillReceiveProps(nextProps) {
    console.warn("Changing contents needs us to flush out all selections.");
    this.setState(this.initState(nextProps));
  }

  insertSegment(sel) {
    this.setState((state, props) => {
      // First break up selection to be based on a single sentence.
      for (let i = 0; i < state.selections.length; i++) {
        if (i < sel[0][0] || i > sel[1][0]) { // ignore mes.
        } else { // get offsets.
          let start = (sel[0][0] === i) ? sel[0][1] : 0;
          let end = (sel[1][0] === i) ? sel[1][1] : state.lengths[i];

          let segmentSelections = state.selections[i];

          for (let j = 0; j < segmentSelections.length; j++) {
            let [start_, end_] = segmentSelections[j];
            // These segments can do one of 4 things:
            if (end < start_) { // - be disjoint
              // ok, we can insert at the beginning and be done with it.
              segmentSelections.splice(j, 0, [start, end]);
              break;
            } else if (end_ < start) { // do nothing here.
            } else { // there is some overlap: merge these two spans.
              segmentSelections.splice(j--, 1);
              [start, end] = [Math.min(start, start_), Math.max(end, end_)];
            }
          }
          // Handle the edge case
          if (segmentSelections.length === 0 || segmentSelections[segmentSelections.length-1][1] < start) {
            segmentSelections.push([start, end]);
          }
        }
      }
      return {
        "selections": state.selections,
      }
    });
  }

  removeSegment(sel) {
    console.assert(sel[0][0] === sel[1][0]);

    this.setState((state, props) => {
      let i = sel[0][0];
      let [start, end] = [sel[0][1], sel[1][1]];

      let segmentSelections = state.selections[i];
      for (let j = 0; j < segmentSelections.length; j++) {
        let [start_, end_] = segmentSelections[j];
        // These segments can do one of 4 things:
        if (end < start_ || end_ < start) { // - disjoint, ignore
        } else { // there is some overlap: merge these two spans.
          console.assert(start_ === start && end_ === end);
          segmentSelections.splice(j--, 1);
        }
      }

      return {
        "selections": state.selections,
      }
    });
  }

  getSegementIndex(node) {
    let rootNode, parentNode;
    if (node.parentNode.nodeName === "SPAN") {
      console.assert(node.parentNode.parentNode !== undefined);
      console.assert(node.parentNode.parentNode.parentNode !== undefined);
      console.assert(node.parentNode.parentNode.parentNode.id === "document-contents");

      rootNode = node.parentNode.parentNode.parentNode;
      parentNode = node.parentNode.parentNode;
    } else {
      console.assert(node.parentNode.parentNode !== undefined);
      console.assert(node.parentNode.parentNode.id === "document-contents");
      rootNode = node.parentNode.parentNode;
      parentNode = node.parentNode;
    }
    for (let i = 0; i < rootNode.childNodes.length; i++) {
      if (rootNode.childNodes[i] === parentNode) {
        return i;
      };
    }
    console.assert(false, "This should just never be possible.");
  }

  getSegementOffset(node) {
    if (node.parentNode.nodeName === "SPAN") {
      node = node.parentNode;
    }

    console.assert(node.parentNode.parentNode !== undefined);
    console.assert(node.parentNode.parentNode.id === "document-contents");

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

  processSelection(selection) {
    let ret = [[-1, -1], [-1, -1]];

    // Figure out which section this text is part of:
    ret[0][0] = this.getSegementIndex(selection.anchorNode);
    ret[0][1] = this.getSegementOffset(selection.anchorNode) + selection.anchorOffset;
    ret[1][0] = this.getSegementIndex(selection.focusNode);
    ret[1][1] = this.getSegementOffset(selection.focusNode) + selection.focusOffset;

    if (ret[0][0] > ret[1][0] ||
        (ret[0][0] === ret[1][0] && ret[0][1] > ret[1][1])) {
      let tmp = ret[1];
      ret[1] = ret[0];
      ret[0] = tmp;
    }

    return ret;
  }

  processClick(node) {
    let ret = [[-1, -1], [-1, -1]];

    // Figure out which section this text is part of:
    ret[0][0] = this.getSegementIndex(node);
    ret[0][1] = this.getSegementOffset(node);
    ret[1][0] = ret[0][0];
    ret[1][1] = ret[0][1] + node.textContent.length;

    if (ret[0][0] > ret[1][0] ||
        (ret[0][0] === ret[1][0] && ret[0][1] > ret[1][1])) {
      let tmp = ret[1];
      ret[1] = ret[0];
      ret[0] = tmp;
    }

    return ret;
  }


  _handleContextMenu(evt) {
    evt.preventDefault();
    return false;
  }

  handleMouseUp(evt) {
    console.log(evt);
    if (evt.button === 0) {
      let selection = document.getSelection();
      if (selection.isCollapsed) return;

      let segment = this.processSelection(selection);
      this.insertSegment(segment);
      // To unselect, we add a negative element to the selection range.
      selection.collapseToEnd();
    } else if (evt.button === 2 && evt.target.nodeName === "SPAN") {
      // Get SPAN extents.
      let segment = this.processClick(evt.target);
      console.log(this.state.selections);
      console.log(segment);
      this.removeSegment(segment);
    }

    return false;
  }

  renderSegment(txt, selections) {
    let children = [];
    let idx = 0;
    for (let i = 0; i < selections.length; i++) {
      let selection = selections[i];

      if (idx < selection[0]) children.push(txt.substring(idx, selection[0]));

      children.push(<span key={i}>{txt.substring(selection[0], selection[1])}</span>);

      idx = selection[1];
    }
    if (idx < txt.length) children.push(txt.substring(idx, txt.length));
    return children;
  }

  // Actually compose the document by chaining together DOM
  // elements and highlights. 
  renderDocument(doc, selections) {
    console.log(this.state);
    console.log(selections);
    let title = <h2>{this.renderSegment(doc.title, selections[0])}</h2>;
    let ps = doc.paragraphs.map((p, i) => {return  <p key={i}>{this.renderSegment(p, selections[i+1])}</p>});
    return (<div id="document-contents" onMouseUp={this.handleMouseUp} onContextMenu={this._handleContextMenu}>
      {title}
      {ps}
      </div>);
  }

  render() {
    let title = (<h3><b>{this.props.title}</b></h3>);
    return (
      <Panel className="document" id={this.props.id} header={title}>
        {this.renderDocument(this.props.contents, this.state.selections)}
      </Panel>
    );
  }
}

export default Document;
