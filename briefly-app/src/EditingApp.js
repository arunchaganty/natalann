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
    return (<p>Edit the short paragraph below</p>);
  }

  subtitle() {
    return (<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }

  instructions() {
    return (
      <div>
      <p className="lead">We'd like you to edit a given paragraph to
      make it <u>grammatically correct</u>, <u>more readable</u>,
      while <u>preserving the original meaning and spirit</u> where
      possible.</p>

      <p>
      For example, the passage:
      <blockquote>
      A sheriff's deputy is accused of shooting a man in the bahamas for
      a family vacation. He is accused of shooting a man in the bahamas
      for a family vacation. He has apologized to the harris family.
      </blockquote>
      could be edited to remove the redundant second line:
      <blockquote>
      A sheriff's deputy is accused of shooting a man in the bahamas for
      a family vacation. He has apologized to the harris family.
      </blockquote>
      </p>

      <p>It's also possible that some parts of the text make no sense in the context of the sentence: you can delete these parts. For example,
        <blockquote>
        <s>"The Tonight Show starring Jimmy Fallon," was a guest on "The Tonight Show starring Jimmy Fallon hits hot 100 with 'ew!,' featuring will.i.am.</s>
        </blockquote>
      </p>


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

    this.state = {
      originalText: props.contents.text || "",
      text: props.contents.text || "",
      wordCount: 0,
      actualTime: 0,
      canSubmit: false,
      intervalId: undefined,
      submitableId: undefined,
    }

    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleUndo = this.handleUndo.bind(this);
    this.updateTime = this.updateTime.bind(this);
    this.updateSubmittable = this.updateSubmittable.bind(this);

    this.componentWillReceiveProps(props);
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

  componentWillReceiveProps(nextProps) {
    if (nextProps.match) {
      let path = this.props.match.params.path;
      axios.get("/" + path)
        .then(res => {
          this.setState(
            this.initState(res.data)
          );
        });
    } else if (nextProps.contents) {
      this.setState(
        this.initState(nextProps.contents)
      );
    }
  }

  initState(contents) {
    let ret = {
      "originalText": contents.text,
      "text": contents.text,
      "wordCount": 0,
      "actualTime": 0,
    }

    return ret;
  }

  updateTime(evt) {
    this.setState((state, props) => ({"actualTime": state.actualTime + 1}));
  }

  updateSubmittable(evt) {
    this.setState({"canSubmit": true});
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

  handleTextChange(evt) {
    this.setState({
      "text": evt.target.value
    });
  }

  handleUndo(evt) {
    this.setState({
      "text": this.state.originalText,
    });
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
            <EditableDocument 
                id="edit-document"
                title="Please edit the text below to make it more readable"
                text={this.state.text}
                onTextChange={this.handleTextChange}
                /> 
          </div>
          <div className="row">
            <Feedback />
          </div>
        </div>
      </div>);
  }
}

App.defaultProps = {
  contents: {id:"", text: ""},
  estimatedTime: 20,
  reward: 0.30,
}

export default App;
