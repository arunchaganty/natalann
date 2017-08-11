import React, { Component } from 'react';
import {Alert, Button, Glyphicon, FormGroup, ControlLabel, FormControl, Panel} from 'react-bootstrap';
import './App.css';
import Document from './Document.js'
import Instructions from './Instructions.js'

class App extends Component {
  title = "Highlight the most important portions of this article";
  subtitle = "";
  instructions = (
    <div>
    <p className="lead">We'd like you to highlight what you think are the most relevant bits of the article shown in the box: imagine that you are shown only the highlighted portions-- would you be able to understand what the article was talking about?</p>

    <h3>General guidelines</h3>
    <ul>
      <li><b>Left-click and drag to select</b> and <b>right-click on to clear</b>.</li>
      <li>Ignore filler material that you think might not be very relevant, e.g., 
        <div className='document'>
          <span>President Kim Jon Un</span>, in a show of force, <span>threatened to attack Guam</span>.
        </div>
    </li>
    </ul>
    </div>
  );

  constructor(props) {
    super(props);
    this.state = this.initState(props);

    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.updateTime = this.updateTime.bind(this);
  }

  componentDidMount() {
    if (document.forms.length > 0) {
      let form = document.forms[0];
      form.addEventListener("onsubmit", this.handleSubmit);
    }

    this.setState({
      "intervalId": window.setInterval(this.updateTime, 1000)
    });
  }

  initState(props) {
    let ret = {
      "selections": this.props.contents.selections,
      "wordCount": 0,
      "actualTime": 0,
      "intervalId": undefined,
    }

    ret.selections.push([]);
    for (let i = 0; i < props.contents.paragraphs.length; i++) {
      ret.selections.push([]);
    }
    return ret;
  }

  getWordCount(selections) {
    // get word count.
    let wordCount = 0;
    for (let i = 0; i < selections.length; i++) {
      if (selections[i].length > 0) {
        let txt = (i === 0) ? this.props.contents.title : this.props.contents.paragraphs[i-1];
        for (let j = 0; j < selections[i].length; j++) {
          let [start, end] = selections[i][j];
          let segment = txt.substring(start, end);
          let ix = 0; 
          while (ix !== -1) {
            wordCount++;
            ix = segment.indexOf(' ', ix+1);
          }
        }
      }
    }
    return wordCount;
  }

  handleSelectionChange(selections) {
    this.setState({
      "selections": selections,
      "wordCount": this.getWordCount(selections),
    });
  }

  updateTime(evt) {
    this.setState((state, props) => ({"actualTime": state.actualTime + 1}));
  }

  handleSubmit(evt) {
    let ret = JSON.parse(this._output.value);
    let wordCount = this.getWordCount(ret);
    console.assert(ret.length === this.props.contents.paragraphs.length+1);
    console.assert(wordCount >= this.props.minWordCount && wordCount <= this.props.maxWordCount);

    if (ret.length === this.props.contents.paragraphs.length+1 &&
          (wordCount >= this.props.minWordCount && wordCount <= this.props.maxWordCount)) {
      return true;
    } else {
      evt.preventDefault();
      return false;
    }
  }

  handleMouseEnter(evt) {
    console.log(evt);
    if (this.state.intervalId === undefined) {
      this.setState({
        "intervalId": window.setInterval(this.updateTime, 1000)
      });
    }
  }

  handleMouseLeave(evt) {
    console.log(evt);
    if (this.state.intervalId !== undefined) {
      window.clearInterval(this.state.intervalId);
      this.setState({
        "intervalId": undefined
      });
    }
  }

  renderProgress() {
    let bsStyle;
    if (this.state.wordCount < this.props.minWordCount) {
      bsStyle = 'warning';
    } else if (this.state.wordCount < this.props.maxWordCount) {
      bsStyle = 'success';
    } else {
      bsStyle = 'danger';
    }

    return <Alert bsStyle={bsStyle}>{this.state.wordCount} words</Alert>;
  }

  renderSubmit() {
    let notDone = (this.state.wordCount < this.props.minWordCount) || (this.state.wordCount > this.props.maxWordCount);
    return <Button type='submit' disabled={notDone} bsSize="large" bsStyle="success"><Glyphicon glyph="ok"/> Submit</Button>
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
    let articleTitle = "Please highlight between " + this.props.minWordCount + "-" + this.props.maxWordCount + " words in the article below that you think capture its most important aspects.";

    return (
      <div className="App" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} >
        <div className="container">
          <div className="row header">
              <h2>{this.title}</h2>
              <h2><small>{this.subtitle}</small></h2>
          </div>
          <div className="row">
            <input ref={(elem) => {this._output = elem}} type="hidden" name="selections" value={JSON.stringify(this.state.selections)} />
            <input type="hidden" name="actualTime" value={this.state.actualTime} />
            <div className="flexbox">
              <Instructions contents={this.instructions} />
              {this.renderTime()}
              {this.renderCost()}
              {this.renderProgress()}
              {this.renderSubmit()}
            </div>
          </div>
          <div className="row">
            <Document 
                id="document"
                title={articleTitle}
                contents={this.props.contents}
                selections={this.state.selections}
                onSelectionChanged={this.handleSelectionChange}
                /> 
          </div>
          <div className="row">
            <Panel>
              <FormGroup controlId="comments">
                <ControlLabel>Comments</ControlLabel> 
                <FormControl name="comments" componentClass="textarea" placeholder="Let us know if you have any comments about the task, etc." />
              </FormGroup>
            </Panel>
          </div>
        </div>
      </div>);
  }
}

App.defaultProps = {
  contents: {title: "", paragraphs: [], selections: []},
  estimatedTime: 60,
  reward: 0.70,
  minWordCount: 50,
  maxWordCount: 100,
}

export default App;
