import React, { Component } from 'react';
import {Alert, Button, Glyphicon, FormGroup, FormControl} from 'react-bootstrap';
import axios from 'axios';
import './EditingApp.css';
import Document from './Document.js'
import EditableDocument from './EditableDocument.js'
import Instructions from './Instructions.js'
import Feedback from './Feedback.js'

class App extends Component {

  title() {
    return (<p>Fact-check the short summary below</p>);
  }

  subtitle() {
    return (<p><b>Ensure that the summary still captures the fact and sentiment conveyed in the original document.</b></p>);
  }

  instructions() {
    return (
      <div>
      <p className="lead">We'd like you to fact-check a given summary to
      ensure it <u>captures the facts and sentiments</u> of the original
      article. If it doesn't we'd like you to <u>edit it so that it does</u>, if possible.
      </p>

      <p>For example:</p>

      <h3>General guidelines</h3>
      <ul>
        <li>
          It's possible that the given sentence is grammatical and does
        not need any edits in which case you can submit the text as is
        after a few seconds.
        </li>
        <li>If you want to undo your changes and return to the original text, click the <Button bsStyle="warning"><Glyphicon glyph="backward" /> Undo</Button> button.</li>
      </ul>
      </div>
    );
  }

  constructor(props) {
    super(props);

    this.state = this.initState(props.contents);

    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.updateTime = this.updateTime.bind(this);
    this.updateSubmittable = this.updateSubmittable.bind(this);
  }

  componentDidMount() {
    if (document.forms.length > 0) {
      let form = document.forms[0];
      form.addEventListener("onsubmit", this.handleSubmit);
    }

    this.setState({
      "intervalId": window.setInterval(this.updateTime, 1000),
      "submittableId": window.setTimeout(this.updateSubmittable, 2000),
    });
  }

  initState(contents) {
    let ret = {
      contents: contents,
      actualTime: 0,
      canSubmit: false,
      intervalId: undefined,
      submitableId: undefined,
      summaryText: contents.summary.text,
    }
    return ret;
  }

  updateTime(evt) {
    this.setState((state, props) => ({"actualTime": state.actualTime + 1}));
  }

  updateSubmittable(evt) {
    this.setState({"canSubmit": true});
  }

  handleTextChange(evt) {
    this.setState({
      summaryText: evt.target.value
    });
  }

  handleSubmit(evt) {
    if (this.state.canSubmit) { // && this.state.text.length > 0) {
      return true;
    } else {
      evt.preventDefault();
      return false;
    }
  }

  handleMouseEnter(evt) {
    if (this.state.intervalId === undefined) {
      this.setState({
        "intervalId": window.setInterval(this.updateTime, 1000)
      });
    }
  }

  handleMouseLeave(evt) {
    if (this.state.intervalId !== undefined) {
      window.clearInterval(this.state.intervalId);
      this.setState({
        "intervalId": undefined
      });
    }
  }


  renderUndo() {
    return <Button disabled={this.state.text == this.state.originalText} bsSize="large" bsStyle="warning" onClick={this.handleUndo}><Glyphicon glyph="backward"/> Undo</Button>;
  }

  renderSubmit() {
    let noSubmit = !this.state.canSubmit; // || this.state.text.trim().length == 0;
    return <Button type='submit' disabled={noSubmit} bsSize="large" bsStyle="success"><Glyphicon glyph="ok"/> Submit</Button>
  }

  renderTime() {
    let minTime = this.props.estimatedTime * 0.6;
    let maxTime = this.props.estimatedTime * 1.4;
    let minMinutes = Math.floor(minTime/60);
    let maxMinutes = Math.floor(maxTime/60);
    return <Alert bsStyle="info"><b>Estimated time:</b> {minMinutes}:{Math.floor(minTime%60)} - {maxMinutes}:{Math.floor(maxTime%60)}</Alert>;
  }
  renderCost() {
    let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
    return <Alert bsStyle="info"><b>Reward:</b> {price.format(this.props.reward)} </Alert>;
  }

  render() {
    const mutable = false;

    return (
      <div className="App" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} >
        <div className="container">
          <div className="row header">
              <h2>{this.title()}</h2>
              <h2><small>{this.subtitle()}</small></h2>
          </div>
          <div className="row">
            <input type="hidden" name="text" value={this.state.text} />
            <input type="hidden" name="actualTime" value={this.state.actualTime} />
            <div className="flexbox">
              <Instructions contents={this.instructions()} />
              {this.renderTime()}
              {this.renderCost()}
              {this.renderUndo()}
              {this.renderSubmit()}
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <EditableDocument 
                  id="edit-document"
                  title="Does the summary below accurately represent the highlighted text in the article on the right?"
                  text={this.state.summaryText}
                  onTextChange={this.handleTextChange}
                  /> 

              <div>
                Does the above summary accurately represent the facts
                and sentiments represented in the article on the right?
                <Button bsStyle="success"><Glyphicon glyph="check"/> Yes</Button>
                <Button bsStyle="warning"><Glyphicon glyph="cross"/> No</Button>
              </div>
            </div>
            <div className="col-md-6">
              <Document 
                  title="Original document"
                  contents={this.state.contents.document}
                  selections={this.state.contents.summary.provenance}
                  /> 
            </div>
          </div>
          <div className="row">
            <Feedback />
          </div>
        </div>
      </div>);
  }
}

App.defaultProps = {
  contents: {
    id:"", 
    document: {
      title: "On Zebras.",
      paragraphs: [
        "Zebras have black and white stripes.",
        "They like to roam on the Serengeti, where they are preyed on by lions.",
      ]
    },
    summary: {
      text: "Zebras eat lions.",
      provenance: [
        [],
        [[0,6,0.6]],
        [[42,70,0.6]]
      ],
    }
  },
  estimatedTime: 180,
  reward: 1.00,
}

export default App;
