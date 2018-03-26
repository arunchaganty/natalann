import React, { Component } from 'react';
import {Alert, Button, Glyphicon, FormGroup, FormControl} from 'react-bootstrap';
import './AttentionApp.css';
import Experiment from './Experiment.js'
import Document from './SelectableDocument.js'
import Instructions from './Instructions.js'
import Feedback from './Feedback.js'

class App extends Experiment {

  title() {
    let topic = this.props.contents.prompt ? "related to " + this.props.contents.prompt : ""

    }
    return (<p>Highlight the most important portions of this article <u>{topic}</u></p>);
  }

  subtitle() {
    if (this.props.selectionMode === "click") {
      return (<p><b>Left-click to select and unselect words</b></p>);
    } else if (this.props.selectionMode === "select") {
      return (<p><b>Left-click and drag to select</b> and <b>right-click on to clear</b></p>);
    } else {
      console.assert(false, "Invalid selection mode");
    }
  }

  instructions() {
    return (
      <div>
      <p className="lead">We'd like you to highlight what you think are
      the most important bits of the article that talk the <u>underlined topic</u> (here, <u>{this.state.contents.prompt}</u>): imagine
      that you are shown only the highlighted portions-- would you be
      able to understand what the article was talking about the <u>topic</u>?</p>

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
      contents: {
        title: "",
        paragraphs: [],
        viewSelections: [],
        recommendedMinWordCount: 10,
        recommendedMaxWordCount: 50,
        prompt: "",
      },
      selections: [[]],
      chosenSelection: 0,
      wordCount: 0,
      actualTime: 0,
      intervalId: undefined,
    }

    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleViewSelectionsChange = this.handleViewSelectionsChange.bind(this);
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

  initState(contents) {
    let ret = {
      "contents": contents,
      "chosenSelection": 0,
      "selections": [],
      "wordCount": 0,
      "actualTime": 0,
    }

    ret.selections.push([]);
    for (let i = 0; i < contents.paragraphs.length; i++) {
      ret.selections.push([]);
    }
    return ret;
  }

  getWordCount(selections) {
    // get word count.
    let wordCount = 0;
    for (let i = 0; i < selections.length; i++) {
      if (selections[i].length > 0) {
        let txt = (i === 0) ? this.state.contents.title : this.state.contents.paragraphs[i-1];
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
    console.assert(ret.length === this.state.contents.paragraphs.length+1);
    console.assert(wordCount >= this.state.contents.recommendedMinWordCount && wordCount <= this.state.contents.recommendedMaxWordCount);

    if (ret.length === this.state.contents.paragraphs.length+1 &&
          (wordCount >= this.state.contents.recommendedMinWordCount && wordCount <= this.state.contents.recommendedMaxWordCount)) {
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

  handleViewSelectionsChange(evt) {
    this.setState({
      "chosenSelection": evt.target.value
    });
  }

  renderProgress() {
    let bsStyle;
    if (this.state.wordCount < this.state.contents.recommendedMinWordCount) {
      bsStyle = 'warning';
    } else if (this.state.wordCount < this.state.contents.recommendedMaxWordCount) {
      bsStyle = 'success';
    } else {
      bsStyle = 'danger';
    }

    return <Alert bsStyle={bsStyle}>{this.state.wordCount} words</Alert>;
  }

  renderSubmit() {
    let notDone = (this.state.wordCount < this.state.contents.recommendedMinWordCount) || (this.state.wordCount > this.props.recommendedMaxWordCount);
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

  renderViewSelections() {
    if (this.state.contents.viewSelections.length > 0) {
      const viewOptions = this.state.contents.viewSelections.map(([label, _], i) => <option key={i} value={i}>{label}</option>)
      viewOptions.push(<option key="none" value={this.state.contents.viewSelections.length}>No annotations</option>);

      return (<FormGroup controlId="formControlsSelect">
              <FormControl componentClass="select" placeholder="select" value={this.state.chosenSelection} onChange={this.handleViewSelectionsChange}>
                {viewOptions}
              </FormControl>
            </FormGroup>);
    }
  }

  render() {
    const articleTitle = (<p>
      Please highlight {this.state.contents.recommendedMinWordCount}–
      {this.state.contents.recommendedMaxWordCount} words in the article
      below that you think capture all the important details about the
      topic: <u>{this.state.contents.prompt}</u>.
      </p>);
    const mutable = (this.state.contents.viewSelections.length === 0 || this.state.chosenSelection > this.state.contents.viewSelections.length-1);
    const selections =  mutable ? this.state.selections : this.state.contents.viewSelections[this.state.chosenSelection][1];

    return (
      <div className="App" onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} >
        <div className="container">
          <div className="row header">
              <h2>{this.title()}</h2>
              <h2><small>{this.subtitle()}</small></h2>
          </div>
          <div className="row">
            <input ref={(elem) => {this._output = elem}} type="hidden" name="selections" value={JSON.stringify(this.state.selections)} />
            <input type="hidden" name="actualTime" value={this.state.actualTime} />
            <div className="flexbox">
              <Instructions contents={this.instructions()} />
              {this.renderTime()}
              {this.renderCost()}
              {this.renderProgress()}
              {this.renderViewSelections()}
              {this.renderSubmit()}
            </div>
          </div>
          <div className="row">
            <Document 
                id="document"
                title={articleTitle}
                contents={this.state.contents}
                selections={selections}
                mutable={mutable}
                onSelectionChanged={this.handleSelectionChange}
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
  contents: {
    title: "",
    paragraphs: [],
    viewSelections: [[]],
    recommendedMinWordCount: 10,
    recommendedMaxWordCount: 50,
    prompt: "",
  },
  estimatedTime: 60,
  reward: 0.70,
  selectionMode: "click",
}

export default App;
