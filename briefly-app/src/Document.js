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

  insertSelection(sel) {
    // First break up selection to be based on a single sentence.
    let newSelections = [];
    for (let i = 0; i < this.state.selections.length; i++) {
      if (i < sel[0][0] || i > sel[1][0]) { // ignore mes.
        newSelections.push(this.state.selections[i]);
      } else { // get offsets.
        let segmentSelections = [];
        let start = (sel[0][0] === i) ? sel[0][1] : 0;
        let end = (sel[1][0] === i) ? sel[1][1] : this.state.lengths[i];
        segmentSelections.push([start, end]);

        newSelections.push(segmentSelections);
      }
    }

    this.setState({
      "selections": newSelections,
      "lengths": this.state.lengths,
    });
  }

  removeSelection(sel) {

  }

  // Identifies a node by its path in the DOM tree, rooted at 
  // 
  getNodePath(node) {
    // TODO: ignore highlight spans
    let path = []
    while (node.id !== "document-contents" && node.parentElement !== null) {
      let siblingIndex = 0;
      while (node.previousSibling !== null) {
        node = node.previousSibling;
        siblingIndex++;
      }
      path.push(siblingIndex);
      node = node.parentElement;
    }
    console.assert(node.id === "document-contents");

    return path.reverse();
  }

  getSegementIndex(node) {
    console.assert(node.parentNode.parentNode !== undefined);
    console.assert(node.parentNode.parentNode.id === "document-contents");
    var rootNode = node.parentNode.parentNode;
    for (let i = 0; i < rootNode.childNodes.length; i++) {
      if (rootNode.childNodes[i] === node.parentNode) {
        return i;
      };
    }
    console.assert(false, "This should just never be possible.");
  }

  getSegementOffset(node) {
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
    console.assert(selection.anchorNode.parentNode !== undefined);
    console.assert(selection.anchorNode.parentNode.parentNode !== undefined);
    console.assert(selection.anchorNode.parentNode.parentNode.id === "document-contents");

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

  handleMouseUp(evt) {
    let selection = document.getSelection();
    if (selection.isCollapsed) return;

    // TODO: identify left/right click.

    let sel = this.processSelection(selection);
    console.log(sel);

    this.insertSelection(sel);
    // To unselect, we add a negative element to the selection range.
    selection.collapseToEnd();
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
    return (<div id="document-contents" onMouseUp={this.handleMouseUp}>
      {title}
      {ps}
      </div>);
  }

  render() {
    let title = (<h3><b>{this.props.title}</b></h3>);
    return (
      <Panel id={this.props.id} header={title}> 
        {this.renderDocument(this.props.contents, this.state.selections)}
      </Panel>
    );
  }
}

export default Document;
