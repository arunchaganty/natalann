import React, { Component } from 'react';
import {Button, Glyphicon, Panel, Well} from 'react-bootstrap';
import update from 'immutability-helper';
import Experiment from './Experiment.js'
import SelectableDocument from './SelectableDocument.js'
import SegmentList from './SegmentList';

import './SelectAcceptabilityApp.css';

class App extends Experiment {
  constructor(props) {
    super(props);
    this.handleValueChanged = this.handleValueChanged.bind(this);
    this.setUpNextTimer = this.setUpNextTimer.bind(this);
    this.moveToNextTask = this.moveToNextTask.bind(this);
  }

  setUpNextTimer() {
    //50 characters ~ 1s
    const PER_CHAR = 1000./50;
    const time = this.props.contents[this.state.currentIdx].text.length * PER_CHAR;
    this.nextTimer = window.setInterval(this.moveToNextTask, time);
  }

  moveToNextTask() {
    if (this.nextTimer) {
      window.clearInterval(this.nextTimer);
      this.nextTimer = undefined;
    }

    this.setState(state => {
        state = update(state, {canNext: {$set: true}});
        if (this.state.currentIdx == this.props.contents.length-1) {
          state = update(state, {canSubmit: {$set: true}});
        }
        return state;
      });
  }

  componentDidMount() {
    super.componentDidMount();
    this.setUpNextTimer();
  }

  instructionsVersion() {
    return '20180122';
  }

  instructions() {
    return (<InstructionContents
      isFirstTime={this.state.firstView}
      editable={!this.state.instructionsComplete}
      onValueChanged={(val) => this.setState({instructionsComplete: val})}
      />);
  }

  title() {
    return (<p>Identify mistakes in the short summary below</p>);
  }
  subtitle() {
    return (<p><b>Highlight grammatical or language errors</b></p>);
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {
      output: {$merge: {
        selections: props.contents.map(_ => []),
      }},
      currentIdx: {$set: 0},
      canNext: {$set: 0},
    });

    if (props._output) {
      state = update(state, {
        output: {$merge: props._output},
      });
    }

    return state;
  }

  handleValueChanged(evt) {
    const value = evt;
    this.setState(state => {
      let diff = {output: {selections: {}}};
      diff.output.selections[state.currentIdx] = {$set: SelectableDocument.updateState(state.output.selections[state.currentIdx], value)};
      return update(state, diff);
    });
  }

  handleSubmit(evt) {
    if (this.state.canSubmit) {
      console.assert(this.state.currentIdx == this.props.contents.length-1);
      return true;
    } else if (this.state.canNext) {
      console.assert(this.state.currentIdx < this.props.contents.length-1);

      this.setState(state => update(state, {$merge: {
        currentIdx: state.currentIdx+1,
        canNext: false,
        canSubmit: false,
      }}));
      this.setUpNextTimer();
      evt.preventDefault();
      return false;
    } else {
      evt.preventDefault();
      return false;
    }
  }

  renderContents() {
    const text =  this.props.contents[this.state.currentIdx].text;
    const selections = this.state.output.selections[this.state.currentIdx];
    return (<Panel
              id="document"
              bsStyle="primary"
              header={<b>Please read the summary below and highlight any <u>grammatical or language</u> errors</b>}
              >
          <SelectableDocument 
              id="document-contents"
              text={text}
              onValueChanged={this.handleValueChanged}
              selections={selections}
              editable={true}
              /> 
        </Panel>);
  }

  renderSubmit() {
    if (this.state.currentIdx < this.props.contents.length-1) {
      return (
        <Button type='button' disabled={!this.state.canNext} bsSize="large" bsStyle="primary" onClick={this.handleSubmit}><Glyphicon glyph="forward" /> Next ({this.state.currentIdx+1} / {this.props.contents.length}) </Button>
        );
    } else {
      return (
        <Button type='submit' disabled={!this.state.canSubmit} bsSize="large" bsStyle="success" onClick={this.handleSubmit}><Glyphicon glyph="ok" /> Submit</Button>
      );
    }
  }
}

App.defaultProps = {
  contents: [
    {id:"", text: "This is test sentence 1.", reference: "This is another sentence 1."},
    {id:"", text: "This is test sentence 2.", reference: "This is another sentence 2."},
    {id:"", text: "This is test sentence 3.", reference: "This is another sentence 3."},
  ],
  estimatedTime: 400,
  reward: 1.25,
}

class Example extends Component {
  constructor(props) {
    super(props);

    let [text, expectedSelections] = this._split(this.props.text);

    this.state = {
      text: text,
      expectedSelections: expectedSelections,
      selections: [],
    }

    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  handleValueChanged(evt) {
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

    let bsStyle, selections, handleValueChanged, well;
    if (this.props.editable) {
      handleValueChanged = this.handleValueChanged;
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
      handleValueChanged = (() => {});
      well = this.props.successPrompt && <span>{this.props.successPrompt}</span>;
    }

    well = well && (<Well bsStyle={bsStyle}>{well}</Well>);

    return (
      <Panel header={title} bsStyle={bsStyle}>
        <p>{this.props.leadUp}</p>
      <blockquote>
        <SelectableDocument
          id={this.props.id + "-document"}
          text={text}
          selections={selections}
          onValueChanged={handleValueChanged}
          />
        {well}
      </blockquote>
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

class InstructionContents extends Component {
  constructor(props) {
    super(props);

    this.state = this.initState(props);
    this.handleValueChanged = this.handleValueChanged.bind(this);
  }
  key = {
    "verb-1": true,
    "missing-1": true,
    "missing-2": true,
    "nonsense-1": true,
    "grammatical-1": true,
  };

  initState(props) {
    let ret = {};
    if (props.isFirstTime) {
      for (let k in this.key) {
        ret[k] = undefined;
      }
    } else  {
      ret = this.key;
    }
    return ret;
  }

  handleValueChanged(update_) {
    this.setState(update_, () => Object.keys(this.key).every(k => this.state[k]) && this.props.onValueChanged(true));
  }

  render() {
    let paymentNote = (this.props.isFirstTime)
      ? (<p><b>Before you proceed with the HIT, you will need to complete the tutorial below</b> (you only need to do this once though!).
        The tutorial should take about <i>5-8 minutes to complete</i> and you will get <b>a (one-time) $0.75 bonus</b> for completing it.
        </p>)
      : undefined;

    return (
      <div>
      <p className="lead">
      Imagine that you are a grade-school English
      teacher reading short essays written by your students: <u>we'd like
      you to highlight any mistakes you find in each sentence.</u>
      </p>

      {paymentNote}

      <h3>How to use the interface</h3>
      <ul>
        <li><b>Click or select some text to mark it</b> as ungrammatical or otherwise poor use of language.</li>
        <li>If you want to <b>undo a highlight, simply click on it</b> to remove it.</li>
        <li>Sometimes the words written by the student are&nbsp;
        <b>undecipherable and are displayed as ▃ </b>. Here, try to be generous
        to the student and imagine what the word is likely to have been.
        For example, in <i>"Leighton ▃ is the first female jockey in the history of Polo."</i>, the ▃  is probably the person's last name.</li>
        <li>Finally, the casing of some of these sentences may be off:
      for example, in <i>"from a man purporting to be Robert&nbsp;
      <u>durst</u>"</i>, <i>"durst"</i> should be capitalized. Please be
      lenient and only mark such examples if you genuinely can't
      understand what was written.</li>
      </ul>

      <h3>Tutorial / Examples</h3>
      <p>
      For the rest of the instructions, we have a tutorial with a couple
      of questions and a few quizzes. While the task certainly has
      subjective elements to it, in order to complete the tutorial you
      will need to highlight the same errors that we have. Don't worry
      though, we'll provide some hints to help you along the way!
      </p>

      <Example
        title="1. A good sentence"
        leadUp="Let's start with a sentence we think is perfectly alright and hence does not need any highlighting."
        text="Yom Hazikaron, held this year on April 22, is Israel's official Memorial Day."
        successPrompt=""
      />

      <Example
        title="2. Bad verb conjugation (example)"
        leadUp="In the following sentence, there is a problem with the verb conjugation problem."
        text="A man |is stood| slumped over in a doorway as two women walk by as they celebrate the New Year."
        successPrompt="The sentence should either be 'A man is standing slumped over...' or 'A man stands slumped over...', so we'd like you to highlight either 'is stood' or just 'stood'."
      />


      <Example
        title="3. Bad verb conjugation (quiz)"
        leadUp="Now, try this next example:"
        text="Mario Balotelli |was| missed Liverpool's 4-1 defeat against Arsenal on Saturday."
        successPrompt={<span>It should probably have been 'had missed' or just 'missed'. Another alternative could have been <i>'Mario Balotelli was missed <u>at</u> Liverpool's ...'</i>.</span>}
        editable={this.props.editable}
        onStateChanged={val => {this.handleValueChanged({"verb-1": val})}}
      />

      <Example
        title="4. Missing words (quiz)"
        leadUp={(<span>
          Next, let's look at an example of a missing word: just select
          the space in between two words if you think something should
          be added here. How about you try this one on your own?
          (<i>Remember, think of ▃  as a "fill-in-the-blank" word (here
            it the first ▃  might be Joy's last name and the second ▃
            is probably valve).</i>)
          </span>)}
        text="Joy ▃ died after she managed to manoeuvre herself over| |edge of her crib and a 'safety ▃ ' cut off the oxygen to her brain."
        successPrompt={<span>It should probably have been 'over <u>the</u> edge'</span>}
        editable={this.props.editable}
        onStateChanged={val => {this.handleValueChanged({"missing-1": val})}}
      />

      <Example
        title="5. Missing punctuation (quiz)"
        leadUp="Here's another one, this time with some missing punctuation."
        text="Paramedics were stretched to the limit| |and in Cambridge, a territorial army field hospital was set-up to deal with drunk partygoers."
        successPrompt={<span>We need a comma before the <i>'and'</i> to separate the two clauses.</span>}
        editable={this.props.editable}
        onStateChanged={val => {this.handleValueChanged({"missing-2": val})}}
      />

      <Example
        title="6. Dealing with nonsense (example)"
        leadUp="Alright, now we'll look at some harder examples. Some of the sentences in the task may have entire parts that really don't make any sense. We'd like you select the smallest region (or regions) that you think are the culprit: imagine that if your student saw these red marks they may know how to fix it. That said, don't be afraid to highlight the whole sentence if it doesn't make sense though."
        text="Paramedics were stretched to the limit and |Cambridge territorial hospital in field a is the|."
        successPrompt=""
        editable={false}
      />

      <Example
        title="7. Dealing with nonsense (example)"
        leadUp="That said, don't be afraid to highlight the whole sentence if it doesn't make sense though."
        text="|▃ ▃ is the largest of ▃ ▃ - a ▃ tomb and part of an ancient ▃ settlement - stands by the mystery|."
        successPrompt=""
        editable={false}
      />


      <Example
        title="8. Dealing with nonsense (quiz)"
        leadUp="Alright, now try this one."
        text="|The arrests of a police officer, a police officer,| was arrested in the street, police say."
        successPrompt=""
        wrongPrompt="As a hint, we think that the latter half of the sentence is more sensible than the first."
        editable={this.props.editable}
        onStateChanged={val => {this.handleValueChanged({"nonsense-1": val})}}
      />

      <Example
        title="9. Grammatical but incoherent sentences (example)"
        leadUp="Finally, let's look at some errors that are perfectly grammatical but still make no sense."
        text="Floyd Mayweather and Manny Pacquiao will fight |Manny Pacquiao| in the match at the MGM Grand Garden Arena on May 2."
        successPrompt="Here, it's simply not possible for Manny Pacquaio to be fighting Manny Pacquaio in a match."
        editable={false}
      />

      <Example
        title="10. Grammatical but incoherent sentences (quiz)"
        leadUp="Alright, this is that last example! Give it a go!"
        text="Miami-dade Fire Rescue Battalion Chief Al Cruz |grew to be more than 10 times that within the next 24 hours|. The fire had burned nearly 2,000 acres and was 50% contained, the fire department says."
        successPrompt={<span>Here, it makes no sense that Al Cruz 'grew' in size. The sentence probably wants to say <i>'... Al Cruz said that the fire would grow to be more ...'</i>.</span>}
        editable={this.props.editable}
        onStateChanged={val => {this.handleValueChanged({"grammatical-1": val})}}
      />
    </div>);
  }
}

InstructionContents.defaultProps = {
  isFirstTime: false,
  editable: false,
  onValueChanged: () => {},
}

export default App;
