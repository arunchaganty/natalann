// Common component for an experiment.
import React, { Component } from 'react';
import {Alert, Button, Glyphicon} from 'react-bootstrap';
import update from 'immutability-helper';
import Instructions from './Instructions.js'
import Feedback from './Feedback.js'

class App extends Component {
  title() {
    return (<p>Task title</p>);
  }
  subtitle() {
    return (<p><b>Elaboration</b></p>);
  }

  instructions() {
    return (
      <div>
      <p className="lead">Key goals for the task.</p>

      <p>
      Examples.
      </p>

      <h3>General guidelines</h3>
      <ul>
        <li>
          Common errors.
        </li>
      </ul>
      </div>
    );
  }
  instructionsComplete() {
    return !Instructions.firstView();
  }

  instructionsIsComplete() {
    return true;
  }

  constructor(props) {
    super(props);

    this.state = this.initState(props);
    this.handleFeedbackChanged = this.handleFeedbackChanged.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    //this.handleUndo = this.handleUndo.bind(this);
    this.updateTime = this.updateTime.bind(this);
  }

  componentDidMount() {
    if (document.forms.length > 0) {
      let form = document.forms[0];
      form.addEventListener("onsubmit", this.handleSubmit);
    }

    this.intervalId = window.setInterval(this.updateTime, 1000);
  }

  componentWillUnmount() {
    window.clearInterval(this.intervalId);
  }

  initState(props) {
    return {
      //canUndo: false,
      canSubmit: false,
      output: {
        actualTime: 0,
        feedback: {},
      },
    }
  }

  updateTime(evt) {
    this.setState((state, props) => update(state, {"output": {"actualTime": {$set: state.output.actualTime + 1}}}));
  }

  handleSubmit(evt) {
    if (this.state.canSubmit) {
      return true;
    } else {
      evt.preventDefault();
      return false;
    }
  }

  handleMouseEnter(evt) {
    if (this.intervalId === undefined) {
      this.intervalId = window.setInterval(this.updateTime, 1000);
    }
  }

  handleMouseLeave(evt) {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  //handleUndo(evt) {
  //  // TODO: implement.
  //}

  handleFeedbackChanged(evt) {
    let newState = update(this.state, {output: {feedback: {$merge: evt}}});
    this.setState(newState);
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
  //renderUndo() {
  //  return <Button disabled={!this.state.canUndo} bsSize="large" bsStyle="warning" onClick={this.handleUndo}><Glyphicon glyph="backward"/> Undo</Button>;
  //}
  renderSubmit() {
    return <Button type='submit' disabled={!this.state.canSubmit} bsSize="large" bsStyle="success" onClick={this.handleSubmit} ><Glyphicon glyph="ok" /> Submit</Button>
  }
  renderTopBox() {
    return (
            <div className="flexbox">
              <Instructions
                  version={this.props.instructionsVersion}
                  contents={this.instructions()}
                  canHide={this.instructionsIsComplete()}
                  onEntering={this.handleMouseLeave}
                  onExiting={this.handleMouseEnter}
              />
              {this.renderTime()}
              {this.renderCost()}
              {this.renderSubmit()}
            </div>
    );
              //{this.renderUndo()}
  }

  renderContents() {
    return (<div>Please implement your task here!</div>);
  }

  render() {
    return (
      <div className="App" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} >
        <input type="hidden" name="output" value={JSON.stringify(this.state.output)} />
        <div className="container">
          <div className="row header">
              <h2>{this.title()}</h2>
              <h2><small>{this.subtitle()}</small></h2>
          </div>
          <div className="row">
            {this.renderContents()}
          </div>
          <div className="row">
            {this.renderTopBox()}
          </div>
          <div className="row">
            <Feedback value={this.state.output.feedback} onChange={this.handleFeedbackChanged} />
          </div>
        </div>
      </div>);
  }
}

App.defaultProps = {
  instructionsVersion: '20171214',
  estimatedTime: 20,
  reward: 0.30,
}

export default App;
