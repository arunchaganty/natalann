import React, { Component } from 'react';
import {Alert, Button, ButtonGroup, Glyphicon, Table} from 'react-bootstrap';
import NaryAnswer from './NaryAnswer';
import EditableDocument from './EditableDocument.js'
import SelectableDocument from './SelectableDocument';
import update from 'immutability-helper';
import levenshtein from 'fast-levenshtein';

import './RatingWidget.css';

function _kv(key, value) {
  let ret = {};
  ret[key] = value;
  return ret;
}

const STYLES = new Map([
  [1, "success"],
  [0, "success"],
  [-1, "success"],
  ["alert", "default"],
  ["active", "active"],
  ["incomplete", "default"],
  ["needs-highlight", "warning"],
  ["complete", "success"],
]);
const GLYPHS = new Map([
  [1, "ok-sign"],
  [0, "minus-sign"],
  [-1, "remove-sign"],
  ["alert", "exclamation-sign"],
  ["active", "pencil"],
  ["incomplete", "star-empty"],
  ["needs-highlight", "exclamation-sign"],
  ["complete", "star"],
]);

class Widget extends Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.value !== nextProps.value);
  }

  static initialValue(text, questions) {
    if (questions === undefined) {
      questions = Object.keys(Widget.QUESTIONS);
    }
    let ret = {ratings: {}, selections: {}, edits: {}, idx:0};
    for (let q of questions) {
      ret.ratings[q] = undefined;
      ret.selections[q] = [];
      ret.edits[q] = text;
    }

    return ret;
  }

  static getStatus(value, question) {
    let options = Widget.QUESTIONS[question];

    // Uh, if this is a "conditional" question, then ensure that all
    // other ratings are (a) defined and (b) <= 0 to consider.
    if (options.conditional) {
      const otherQuestions = Object.keys(value.ratings).filter(q => q !== question);
      if (otherQuestions.length > 0 && otherQuestions.every(q => value.ratings[q] > 0)) {
        return "complete";
      }
      return (value.ratings[question] > 0) ? "complete" : "incomplete";
    }
    if (value.ratings[question] === undefined) return "incomplete";
    //if (options.options.find(o => o.value === value.ratings[question]).needsHighlight &&
    //    value.selections[question].length === 0)
    //  return "needs-highlight";

    return "complete";
  }

  static isComplete(value) {
    let questions = Object.keys(value.ratings);
    return questions.every(q => Widget.getStatus(value, q) === "complete");
  }

  // Handles updating own value.
  static handleValueChanged(value, valueChange, questions) {
    if (questions === undefined) {
      questions = Object.keys(Widget.QUESTIONS);
    }

    if (valueChange.ratings) {
      let [question, valueChange_] = valueChange.ratings;
      value = update(value, {ratings: {$merge: _kv(question, valueChange_)}});
      status = Widget.getStatus(value, question);

      let nextIdx = questions.findIndex(q => Widget.getStatus(value,  q) !== "complete");
      if (status === "complete" && nextIdx !== -1) {
        return {ratings: {$set: value.ratings}, idx: {$set: nextIdx}};
      } else {
        return {ratings: {$set: value.ratings}};
      }
    }
    if (valueChange.selections) {
      let [question, valueChange_] = valueChange.selections;
      valueChange_ = SelectableDocument.updateState(value.selections[question], valueChange_);
      return {selections: {$merge: _kv(question, valueChange_)}};
    }
    if (valueChange.edit) {
      let [question, newText, dist]  = valueChange.edit;
      return {
        ratings: {$merge: _kv(question, dist)},
        edits: {$merge: _kv(question, newText)}
      };
    }
    if (valueChange.idx !== undefined) {
      return {idx: {$set: valueChange.idx}};
    }
    console.warn("Unexpected valueChange ", valueChange);
    return {$set: value};
  }

  renderNaryRows() {
    const self = this;
    const value = this.props.value;
    const questions = this.props.questions;
    let rows = questions.map((question,i) => {
      let options = Widget.QUESTIONS[question];
      if (options.action === "edit") return null;
        
      let status =  Widget.getStatus(value, question);
      let isActive = (i === value.idx);
      let disabled = !isActive;

      let prompt = isActive ? <b>{options.prompt}</b> : options.prompt;
      let classStyle = (status === "needs-highlight") ? "warning" 
                      :(status === "complete") ? "success"
                      :(isActive) ? "active" : "";
      let glyph = (status === "complete") ? GLYPHS.get(value.ratings[question], "complete")
                  : GLYPHS.get(status);

      return (<tr key={question} className={classStyle}>
        <td><Glyphicon glyph={glyph} /></td>
        <td  onClick={() => this.props.onValueChanged({idx: i})}> {prompt} </td>
        <td> <NaryAnswer
          options={options.options}
          disabled={disabled}
          value={value.ratings[question]}
          onValueChanged={value => this.props.onValueChanged({ratings: [question, value]})}
          />
        </td>
        </tr>);
    });

    return rows;
  }

  renderEditRows() {
    const self = this;
    const value = this.props.value;
    const questions = this.props.questions;
    let rows = questions.map((question,i) => {
      const otherQuestions = questions.filter(q => q !== question);
      let options = Widget.QUESTIONS[question];
      if (options.action !== "edit") return null; 

      // Check that the condition is met.
      if (options.conditional && 
          otherQuestions.length > 0 && 
          (otherQuestions.some(q => value.ratings[q] === undefined) ||
           otherQuestions.every(q => value.ratings[q] > 0))) {
        return null;
      }
        
      let status =  Widget.getStatus(value, question);
      let isActive = (i === value.idx);
      let disabled = !isActive;

      let prompt = isActive ? <b>{options.prompt}</b> : options.prompt;
      let classStyle = (status === "needs-highlight") ? "warning" 
                      :(status === "complete") ? "success"
                      :(isActive) ? "active" : "";
      let glyph = GLYPHS.get(status);
      let editStyle = (status === "complete") ? "success" : "warning";

      return (<tr key={question}>
        <td><Glyphicon glyph={glyph} /></td>
        <td  onClick={() => this.props.onValueChanged({idx: i})}> 
          {prompt} <hr/> 
          <EditableDocument
              text={self.props.text}
              value={value.edits[question]}
              onValueChanged={value => self.props.onValueChanged({edit: [question, value, levenshtein.get(self.props.text, value)]})}
              editable={self.props.editable}
              />
        </td>
        <td>
        <ButtonGroup>
          <Button bsStyle={editStyle}><Glyphicon glyph="pencil" /> {value.ratings.edit || 0} chars.</Button>
        </ButtonGroup>
        </td>
        </tr>);
    });

    return rows;
  }

  render() {
    let value = this.props.value;
    let question = this.props.questions[value.idx];
    let options = Widget.QUESTIONS[question];
    let status = Widget.getStatus(value, question);

    let alert;
    if (options.highlightPrompt) {
      alert = (<Alert bsStyle={status === "needs-highlight" ? "warning" : "info"}>
            <b>Please {options.highlightPrompt}</b>
          </Alert>);
    }

    return (<div className="RatingWidget">
          {alert}

          <SelectableDocument 
                        text={this.props.text}
                        selections={this.props.value.selections[question]}
                        onValueChanged={value => this.props.onValueChanged({selections: [question, value]})}
                        editable={this.props.editable}
                        />
          <hr />
          <Table>
            <thead>
              <tr>
                <th width="5%"></th>
                <th width="75%">Question</th>
                <th width="20%">Response</th>
              </tr>
            </thead>
            <tbody>
              {this.renderNaryRows()}
              {this.renderEditRows()}
            </tbody>
          </Table>
        </div>);
  }
}

Widget.QUESTIONS = {
  "grammar": {
    prompt: "Is the above paragraph fluent?",
    definition: (<p>
      A good paragraph should have no obvious grammar errors ("<i>Bill Clinton going to Egypt was.</i>") that make the text difficult to read.
      It should also nonsensical matter like "<i>Floyd Mayweather and Manny Pacquiao will fight <u>Manny Pacquiao</u> in the match</i>"
      </p>),
    //highlightPrompt: "highlight any portions of the text that seem ungrammatical",
    options: [{
        style: "success",
        glyph: "ok",
        tooltip: "It reads as fluently as something you might read in a newspaper.",
        value: 1,
        needsHighlight: false,
      },{
        style: "warning",
        glyph: "minus",
        tooltip: "It has a few errors, but you can mostly understand it.",
        value: 0,
        needsHighlight: true,
      },{
        style: "danger",
        glyph: "remove",
        tooltip: "You can hardly understand it at all.",
        value: -1,
        needsHighlight: true,
      },
    ],
    examples: [{
        id: "grammar-e1",
        title: "E1. Fluency",
        text: "Nine people tried to enter Syria illegally, according to local media.",
        questions: ["grammar"],
        expected: {ratings: {grammar: 1}, selections:{grammar: []}, idx:0},
        successPrompt:"The sentence is perfectly normal.",
      },{
        id: "grammar-e2",
        title: "E2. Fluency",
        text: "Thousands of South Africans take to the streets of to rally in Durban. # ▃ , # ▃ and # ▃ are some of the most popular. \"people listen him,\" says.",
        questions: ["grammar"],
        expected: {ratings: {grammar: -1}, selections:{grammar: [[48,50],[71,145]]}, idx:0},
        successPrompt:"We couldn't make any sense of this sentence either!",
      },{
        id: "grammar-e3",
        title: "E3. Fluency",
        text: "Yuka Ogata wanted to make make a point about the challenges working women face in Japan.",
        questions: ["grammar"],
        expected: {ratings: {grammar: 0}, selections:{grammar: [[21,30]]}, idx:0},
        successPrompt:"Even though the sentence contains a repeated word that makes it ungrammatical, it's fairly easy to understand what it means.",
      },],
  },
  "redundancy": {
    prompt: "Does the above paragraph contain very little nor no redundant content?",
    definition: (<p>A good paragraph should not have any unnecessary repetition, like
      having a sentence repeated multiple times or using
      full names (<i>"Bill Clinton"</i>) or long phrases (<i>"the Affordable Care Act"</i>) repeatedly instead of a
      pronoun (<i>"he"</i>) or short phrases (<i>"the law"</i>). </p>),
    //highlightPrompt: "highlight the least informative redundant portions of the text if any",
    options: [{
        style: "success",
        glyph: "ok",
        tooltip: "There is no or very little repeated content.",
        value: 1,
        needsHighlight: false,
      },{
        style: "warning",
        glyph: "minus",
        tooltip: "There are a few repetitive portions (e.g. reusing proper nouns) that could be improved.",
        value: 0,
        needsHighlight: true,
      },{
        style: "danger",
        glyph: "remove",
        tooltip: "There are significant portions that are repeated.",
        value: -1,
        needsHighlight: true,
      },
    ],
    examples: [{
        id: "redundancy-e1",
        title: "E1. Redundancy",
        text: "Chelsea are looking to beat Manchester City to sign Brazilian prospect Nathan. The attacking midfielder turned 19 last month but has been in contract dispute with his club Atletico Paranaense. He is due to speak to Chelsea next week ahead of a proposed move to Stamford Bridge which would likely see him loaned out.",
        questions: ["redundancy"],
        expected: {ratings: {redundancy: 1}, selections:{redundancy: []}, idx:0},
        successPrompt:"There is no repeated information",
      },{
        id: "redundancy-e2",
        title: "E2. Redundancy (pick the less informative part)",
        text: "Nearly 6 in 10 Americans say they should be required to serve gay or lesbian couples just as they would heterosexual couples. A new poll finds 57 % feel businesses like gazelle or ▃ should be required to serve gay or lesbian couples.",
        questions: ["redundancy"],
        expected: {ratings: {redundancy: -1}, selections:{redundancy: [[0,84]]}, idx:0},
        successPrompt:"The second sentence contains basically all the information of the first sentence!",
      },{
        id: "redundancy-e3",
        title: "E3. Redundancy (think pronouns and repeated events)",
        text: "Bell was stopped in Bell's Chevrolet after a police officer noticed a strong smell of marijuana. After Bell was stopped, he was charged with marijuana possession.",
        questions: ["redundancy"],
        expected: {ratings: {redundancy: 0}, selections:{redundancy: [[20,26],[97,119]]}, idx:0},
        successPrompt:"In the second sentence we learn the new fact that Bell was charged with possession, but 'Bell' was repeated several times where pronouns like 'his' would do. The fact that Bell was stopped was also repeated.",
      },],
  },
//  "clarity": {
//    prompt: "Is it clear who/what have been mentioned in the above paragraph?",
//    definition: (<p>
//      In good writing, it should be easy to figure out exactly who/what
//      is being mentioned in the article, particularly with pronouns
//      (<i>he</i>) or referring expressions (<i>the law</i>). Typically,
//      these are defined before they are defined.
//      </p>),
//    highlightPrompt: "highlight the people/organizations/events/etc. that are unclear",
//    action: "select",
//    options: [{
//        style: "success",
//        glyph: "ok",
//        tooltip: "All mentions of people/places are clearly defined.",
//        value: 1,
//        needsHighlight: false,
//      },{
//        style: "warning",
//        glyph: "minus",
//        tooltip: "Most mentions of people/places are clearly defined.",
//        value: 0,
//        needsHighlight: true,
//      },{
//        style: "danger",
//        glyph: "remove",
//        tooltip: (<span>Most mentions of people/places are <b>not</b> clearly defined.</span>),
//        value: -1,
//        needsHighlight: true,
//      },
//    ],
//    examples: [{
//        id: "clarity-e1",
//        title: "E1. Clarity",
//        text: "The planet is about 93 million miles from the Sun. The Pathfinder probe was launched in 2004 and traveled more than six and a half years before it started orbiting Mercury.",
//        questions: ["clarity"],
//        expected: {ratings: {clarity: 0}, selections:{clarity: [[0,10]]}, idx:0},
//        successPrompt:"It isn't entirely clear which planet is referred to in the first sentence.",
//      },{
//        id: "clarity-e2",
//        title: "E2. Clarity",
//        text: "The American Pharmacists Association is discouraging its members from participating in executions. The group acted this week because of increased public attention on lethal injection.",
//        questions: ["clarity"],
//        expected: {ratings: {clarity: 1}, selections:{clarity: []}, idx:0},
//        successPrompt:"It's absolutely clear which group acted in the second sentence.",
//      },{
//        id: "clarity-e3",
//        title: "E3. Clarity (think about the referring expressions, e.g. 'the law')",
//        text: "The group votes at the meeting to adopt a ban as an official policy. The group is banning the use of the term \"drug\" for the chemicals used.",
//        questions: ["clarity"],
//        expected: {ratings: {clarity: -1}, selections:{clarity: [[0,10], [19,30], [121,134]]}, idx:0},
//        successPrompt:"It's not at all clear which group, which meeting or which chemicals are being talked about.",
//      },],
//  },
//  "focus": {
//    prompt: "Does the above paragraph have a clear focus?",
//    definition: (<p>A good summary has a clear focus and sentences
//      should only contain information that is related to the rest of the
//      summary.</p>),
//    highlightPrompt: "highlight the points (e.g. people, organizations, events, etc.) of focus.",
//    action: "select",
//    options: [{
//        style: "success",
//        glyph: "ok",
//        tooltip: "There is a single clear object of focus.",
//        value: 1,
//        needsHighlight: true,
//      },{
//        style: "warning",
//        glyph: "minus",
//        tooltip: "There are a few, mostly clear, objects of focus.",
//        value: 0,
//        needsHighlight: true,
//      },{
//        style: "danger",
//        glyph: "remove",
//        tooltip: "There is no clearly discernable object of focus.",
//        value: -1,
//        needsHighlight: false,
//      },
//    ],
//    examples: [{
//        id: "focus-e1",
//        title: "E1. Focus",
//        text: "Iraqi and U.S.-LED coalition forces say they retook a key refinery from Isis. Peshmerga forces also report retaking terrain from Isis.",
//        questions: ["focus"],
//        expected: {ratings: {focus: 1}, selections:{focus: [[45,76],[107,134]]}, idx:0},
//        successPrompt:"Both sentences talk about military advances against ISIS.",
//      },{
//        id: "focus-e2",
//        title: "E2. Focus",
//        text: "Isis claims it controlled part of the facility, posting images online that purported to back up the claim. Iraq is working to fortify the facility's defenses, the council said. The Peshmerga are the national military force of Kurdistan.",
//        questions: ["focus"],
//        expected: {ratings: {focus: 0}, selections:{focus: [[0,4],[34, 46], [107,111], [134,146]]}, idx:0},
//        successPrompt:"While the sentences generally talk about the situation in Iraq, the first two sentences are about a particular facility, while the last sentence does not have any clear connection with the first two.",
//      },{
//        id: "focus-e3",
//        title: "E3. Focus",
//        text: "Jeffrey Sachs: Raw Capitalism is the economics of greed. Last year was the earth's hottest year on record, Gore says.",
//        questions: ["focus"],
//        expected: {ratings: {focus: -1}, selections:{focus: []}, idx:0},
//        successPrompt:"The second sentence seems to be talking about something completely different from the first!",
//      },],
//  },
  "overall": {
    prompt: "Overall, rate the quality of the paragraph.",
    definition: (<p>Using the factors above, decide on how highly you would rate the summary.</p>),
    options: [{
        style: "success",
        glyph: "thumbs-up",
        tooltip: "You'd give it an A grade.",
        value: 1,
        needsHighlight: false,
      },{
        style: "warning",
        glyph: "hand-right",
        tooltip: "You'd give it a C or B at best.",
        value: 0,
        needsHighlight: false,
      },{
        style: "danger",
        glyph: "thumbs-down",
        tooltip: "This one's an outright F.",
        value: -1,
        needsHighlight: false,
      },
    ],
    examples: [{
        id: "overall-e1",
        title: "E1. Overall",
        text: "Geologists used undersea vehicles to record two underwater volcanic vents - called Hades and Prometheus - as they erupted near Samoa. Scientists found the acoustic signatures of the eruptions were different. They hope to use sound to monitor underwater eruptions as they happen.",
        questions: ["overall"],
        expected: {ratings: {overall: 1}, selections:{overall: []}, idx:0},
        successPrompt:"The summary checks off all the above question boxes and seems enjoyable to read.",
      },{
        id: "overall-e2",
        title: "E2. Overall",
        text: "The  ▃  second scan lasts three seconds, scan for four and a half to register your interest. The  ▃  second scan lasts three seconds, scan for four and a half to register your interest.",
        questions: ["overall"],
        expected: {ratings: {overall: -1}, selections:{overall: []}, idx:0},
        successPrompt:"We didn't get any useful information from this summary at all.",
      },
    ],
  },
  "edit": {
    prompt: "Please improve the quality of the paragraph as much as possible.",
    //highlightPrompt: "improve the quality of the paragraph as much as possible.",
    definition: (<p>
      Finally, we'd like you to improve the paragraph as much as possible; some times this means deleting entire non-sensical sentences.
      Note that in the tutorial questions below, because we can only check for one of several short edits, we have highlighted the portions of the text that we'd like you to edit.
      If your correction doesn't pass at first, please try another.
      </p>),
    action: "edit",
    conditional: true,
    options: [],
    examples: [{
        id: "edit-e1",
        title: "E1. Edits",
        text: "A sheriff's deputy is accused of shooting a man in the Bahamas for a family vacation.",
        questions: ["edit"],
        expected: {
          ratings:{edit: 5},
          selections:{edit: [[63,84]]},
          edits: {edit: "A sheriff's deputy is accused of shooting a man in the Bahamas during a family vacation.",},
          editOptions: {edit: [
            "A sheriff's deputy is accused of shooting a man in the Bahamas during a family vacation.",
            "A sheriff's deputy is accused of shooting a man in the Bahamas while on a family vacation.",
            "A sheriff's deputy is accused of shooting a man in the Bahamas while he was on a family vacation.",
            "A sheriff's deputy is accused of shooting a man in the Bahamas when he was on a family vacation.",
          ]},

          idx:0},
        successPrompt:"The phrase 'for a vacation' just doesn't make sense in this context.",
      },{
        id: "edit-e2",
        title: "E2. Edits",
        text: "Bell was stopped in Bell's Chevrolet after a police officer noticed a strong smell of marijuana. After Bell was stopped, he was charged with marijuana possession.",
        questions: ["edit"],
        expected: {
          ratings:{edit: 26},
          selections:{edit: [[20,26],[97,119]]},
          edits: {edit: "Bell was stopped in his Chevrolet after a police officer noticed a strong smell of marijuana. He was then charged with marijuana possession."},
          editOptions: {edit: [
            "Bell was stopped in his Chevrolet after a police officer noticed a strong smell of marijuana. He was then charged with marijuana possession.",
            "Bell was stopped in his Chevrolet after a police officer noticed a strong smell of marijuana. He was charged with marijuana possession.",
            "Bell was stopped in his Chevrolet after a police officer noticed a strong smell of marijuana, after which he was charged with marijuana possession.",
            "Bell was stopped in his Chevrolet after a police officer noticed a strong smell of marijuana. Then, he was charged with marijuana possession.",
          ]},
          idx:0},
        successPrompt:"\"Bell's\" can be replaced with a pronoun (his) and \"Bell was stopped\" can be shortened.",
      },{
        id: "edit-e3",
        title: "E3. Edits (removing nonsense)",
        text: "Thousands of South Africans take to the streets of to rally in Durban. # ▃ , # ▃ and # ▃  most are . .  popular says him .",
        questions: ["edit"],
        expected: {
          ratings:{edit: 26},
          selections:{edit: [[48,50],[71,122]]},
          edits: {edit: "Thousands of South Africans take to the streets to rally in Durban."},
          editOptions: {edit: [
            "Thousands of South Africans take to the streets to rally in Durban.",
            "Thousands of South Africans take to the streets of Durban to rally.",
          ]},
          idx:0},
        successPrompt:"The last part is just nonsense.",
      }
    ],
  },
};

// top 3 are givens,
// value is actually 'state'.
Widget.defaultProps = {
  text: "The group votes at the meeting to adopt a ban as an official policy . The group is banning the use of the term \"drug\" for the chemicals used.",
  value: Widget.initialValue("The group votes at the meeting to adopt a ban as an official policy."),
  onValueChanged: () => {},
  requireSelections: false,
  editable: false,
  questions: ["grammar", "redundancy", "overall", "edit",],
}

export default Widget;
