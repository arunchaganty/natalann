import React, { Component } from 'react';
import { Panel, Well } from 'react-bootstrap';
import update from 'immutability-helper';
import SegmentList from './SegmentList';
import SelectableDocument from './SelectableDocument';

/***
 * Renders a document within a div.
 */
class Example extends Component {
  constructor(props) {
    super(props);

    let [text, expectedSelections] = this._split(this.props.text);

    this.state = {
      text: text,
      expectedSelections: expectedSelections,
      selections: [],
    }

    this.handleSelectionChanged = this.handleSelectionChanged.bind(this);
  }

  handleSelectionChanged(evt) {
    const value = evt;
    this.setState(state => update(state, {selections: {$set: SelectableDocument.updateState(state.selections, value)}}), () => {
        this.props.onStateChanged(SegmentList.equals(this.state.expectedSelections, this.state.selections))
    });
  }

  _split(txt) {
    let text = "";
    let expectedSelections = [];

    let start = -1;
    for (let char of txt) {
      if (char === "|") {
        if (start === -1) {
          start = text.length;
        } else {
          expectedSelections.push([start, text.length]);
          start = -1;
        }
      } else {
        text += char;
      }
    }
    return [text, expectedSelections];
  }

  render() {
    let title = this.props.title && (<h3><b>{this.props.title}</b></h3>);

    let text = this.state.text;
    let expectedSelections = this.state.expectedSelections;

    let bsStyle, selections, handleSelectionChanged, well;
    if (this.props.editable) {
      handleSelectionChanged = this.handleSelectionChanged;
      selections = this.state.selections;
      if (selections.length === 0) {
        bsStyle = "primary";
      } else if (SegmentList.equals(expectedSelections, selections)) {
        bsStyle = "success";
        well = <span><b>That's right!</b> {this.props.successPrompt}</span>
      } else if (SegmentList.contains(expectedSelections, selections)) {
        bsStyle = "warning";
        well = <span><b>Almost! We're expecting something bigger.</b> {this.props.biggerPrompt}</span>
      } else if (SegmentList.contains(selections, expectedSelections)) {
        bsStyle = "warning";
        well = <span><b>Almost! We're expecting something smaller.</b> {this.props.smallerPrompt}</span>
      } else {
        bsStyle = "danger";
        well = <span><b>Hmm.. that doesn't seem quite right.</b> {this.props.wrongPrompt}</span>
      }
    } else {
      selections = expectedSelections;
      bsStyle = "success";
      handleSelectionChanged = (() => {});
      well = this.props.successPrompt && <span>{this.props.successPrompt}</span>;
    }

    well = well && (<Well bsStyle={bsStyle}>{well}</Well>);

    return (
      <Panel header={title} bsStyle={bsStyle}>
        <p>{this.props.leadUp}</p>
        <SelectableDocument
          id={this.props.id + "-document"}
          text={text}
          selections={selections}
          onSelectionChanged={handleSelectionChanged}
          />
        {well}
      </Panel>
    );
  }
}

Example.defaultProps = {
  id: "#example",
  title: "#. Description of example.",
  text: "Yom Hazikaron, held this year on April 22, is Israel's official Memorial Day.",
  editable: false,
  onStateChanged: () => {},
  successPrompt: "",
  almostPrompt: "You've selected more than what you needed to!",
  wrongPrompt: "",
}

export default Example;
