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
      <p className="lead">We'd like you to correct any errors in the given paragraph.</p>
      <p>Note that it's possible that no edits need to be made, in which case, you can submit the text as is. </p>
      <p>It's also possible that some parts of the text makes no sense, in which case, delete these parts.</p>

      <h3>General guidelines</h3>
      <ul>
        <li>Click a word to select it and click again to unselect it.</li>
        <li>Feel free to ignore filler material, e.g., 
        <blockquote>
          <div className='document'>
            <span>President</span> <span>Kim</span> <span>Jong</span> <span>Un</span>, in a show of force, <span>threatened</span> to <span>attack</span> <span>Guam</span>.
          </div>
        </blockquote>
      </li>
        <li>Please keep highlights relevant to the <u>topic</u>, but do include any context you think is necessary; for example,
        <blockquote>
          <div className='document'>
            <span>Tensions</span> in the <span>Korean</span> <span>Peninusla</span> have <span>escalated</span> <span>after</span> <span>President</span> <span>Trump</span> <span>promised</span> <span>fire</span> and <span>fury</span> in response to any aggression from North Korea.
            <span>President</span> <span>Kim</span> <span>Jong</span> <span>Un</span>, in a show of force, <span>threatened</span> to <span>attack</span> <span>Guam</span>.
          </div>
        </blockquote>
      </li>
      <li>When the topic is <u>anything</u> highlight any parts of the article that you think are important.</li>
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
    if (this.state.canSubmit && this.state.text.length > 0) {
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
    let noSubmit = !this.state.canSubmit || this.state.text.trim().length == 0;
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
