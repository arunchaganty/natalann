import React, { Component } from 'react';
import {Button, Glyphicon, Panel} from 'react-bootstrap';
import update from 'immutability-helper';
import './EditingApp.css';
import Experiment from './Experiment.js'
import Document from './Document.js'
import LikertGroup from './LikertGroup.js'
import Tutorial from './Tutorial.js'
import Instructions from './Instructions.js'

class App extends Experiment {
  constructor(props) {
    super(props);
    this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
    this.updateInstructionAnswers = this.updateInstructionAnswers.bind(this);
  }

  title() {
    return (<p>Rate the short summary below</p>);
  }
  subtitle() {
    return null; //(<p><b>Correct grammatical errors, remove repeated text, etc.</b></p>);
  }

  updateInstructionAnswers(evt) {
    const value = evt;
    this.setState(state => update(state, {instructionAnswers: {$merge: value}}));
  }

  instructions() {
    let lede;
    if (this.instructionsIsComplete()) {
      lede = undefined;
    } else {
      lede = (<p className="lead">
        <b>Before you proceed with the HIT, you will need to complete the tutorial below</b> (you only need to do this once though!).
      </p>);
    }
    return (<div>
      {lede}

      <h3>General instructions</h3>
      <p>
        We'd like you to rate how good a short summary of a news article
        is by answering a few questions.&nbsp;
        <b>We will explain each of these questions below with a brief quiz at
        the end of each section. You must correctly answer the quiz
        question to proceed.</b>&nbsp;
        In the actual task, we'll also provide a model summary for the
        same article to help provide reference for what a '5' should
      look like.
      </p>

      <h3>Question definitions (and quiz!)</h3>
      <Tutorial
          contents={App.tutorial}
          value={this.state.instructionAnswers}
          onChange={this.updateInstructionAnswers}
      />

      <h3>Other details</h3>
      <ul>
        <li><b>Rejection policy:</b>&nbsp;
          We understand that this is a subjective task and that it's
          possible to have a different opinion that those of other
          annotators. However, if your answers consistently differ from the
          consensus opinion, we will manually review your responses and make
          a judgement of whether or not to reject <i>all</i> your work.
        </li>
      </ul>
    </div>);
  }

  instructionsIsComplete() {
    const value = this.state.instructionAnswers;
    const entries = Object.entries(App.tutorial);

    for (let i = 0; i < entries.length; i++) {
      const [key, cat] = entries[i];
      const answers = cat.questions.map((_, i) => value && value["ex-" + key + "-" + i]);
      if (!answers.every((e, i) => e === cat.questions[i][1])) {
        return false;
      }
    }
    return true;
  }

  initState(props) {
    let state = super.initState(props);
    state = update(state, {
      output: {$merge: {
        responses: {
          "grammar": undefined,
          "redundancy": undefined,
          "clarity": undefined,
          "focus": undefined,
          "coherence": undefined,
          },
        }},
    });
    if (Instructions.firstView()) {
      state = update(state, {$merge: {instructionAnswers: {
      }}});
    } else {
      state = update(state, {$merge: {instructionAnswers: App.tutorialAnswers}});
    }

    return state;
  }

  handleAnswersChanged(evt) {
    const value = evt;
    this.setState(state => {
      state = update(state, {output: {responses: {$merge: value}}}); 
      if (Object.values(state.output.responses).every(x => x !== undefined)) {
        state = update(state, {canSubmit: {$set: true}});
      }
      return state;
    });
  }

  renderContents() {
    const questions = [
      ["grammar", 
          "How grammatical was the summary?",
          "Not at all",
          "Perfectly"],
      ["redundancy", 
        "How non-redunant was the summary?",
        "Very redundant",
        "Not redundant"],
      ["clarity", 
        "How often could you understand who/what was mentioned in the summary?",
        "Never",
        "Always"],
      ["focus", 
        "How clear was the focus of the summary?",
        "Not at all",
        "Perfectly"],
      ["coherence", 
        "How coherent was the summary?",
        "Not at all",
        "Perfectly"],
    ];

    return (<div>
        <div>
          <Document 
              id="text"
              title="Please read the summary below and rate it below"
              text={this.props.contents.text}
              editable={false}
              /> 
          <Document 
              id="text"
              title="Compare the above summary with this 'model' summary when answering the questions below"
              text={this.props.contents.reference}
              editable={false}
              /> 

        </div>
        <Panel header={<b>Please rate the above summary relative to the model summary on the following qualities</b>}>
          <LikertGroup name="responses" questions={questions} value={this.state.output.responses} onChange={this.handleAnswersChanged} />
        </Panel>
      </div>);
  }
}

function getAnswers(tutorial) {
  let ret = {}

  const entries = Object.entries(tutorial);
  for (let i = 0; i < entries.length; i++) {
    const [key, cat] = entries[i];
    cat.questions.forEach((q,i) => ret["ex-" + key + "-" + i] = q[1]);
  }
  return ret;
}

App.tutorial = {
  "grammar": {
    "title": "How grammatical was the summary?",
    "definition": (<p>A good summary should have no spelling errors or obvious grammar
      errors (<i>"Bill Clinton was going to."</i>) that make the text
      difficult to read.</p>),
    "example5": "it reads as fluently as something you might read in a newspaper.",
    "example1": "you can not understand what is being said at all.",
    "questions": [
      ["Nine people tried to enter Syria illegally , according to local media .",
        4, "The sentence is 100% grammatical!"
      ], [
        "Thousands of South Africans take to the streets of to rally in Durban . # ▃ , # ▃ and # ▃ are some of the most popular . `` people listen him , '' says .",
        0, "We couldn't make any sense of this sentence either!",
      ], [
        "Yuka Ogata wanted to make make a point about the challenges working women face in Japan.",
        3, "Even though the sentence contains a repeated word that makes it ungrammatical, it's fairly easy to understand what it means.",
      ]],
  },
  "redundancy": {
    "title": "How non-redundant was the summary?",
    "definition": (<p>A good summary should not have any unnecessary repetition,
      which can arise if a sentence is repeated multiple times or uses
      full names (<i>"Bill Clinton"</i>) or long phrases (<i>"the Affordable Care Act"</i>) repeatedly instead of a
      pronoun (<i>"he"</i>) or short phrases (<i>"the law"</i>). </p>),
    "example5": "it contains no repeated information even if it may be ungrammatical, etc.",
    "example1": "it contains no information at all.",
    "questions": [
      ["Chelsea are looking to beat Manchester City to sign Brazilian prospect Nathan . The attacking midfielder turned 19 last month but has been in contract dispute with his club Atletico Paranaense . He is due to speak to Chelsea next week ahead of a proposed move to Stamford Bridge which would likely see him loaned out .",
        4, "There is no repeated information."
      ], [
      //  "▃ was charged in Pakistan in 2009 , accused of killing Osama bin Laden . ▃ was charged in Pakistan in 2009 , accused of killing Osama bin Laden .",
      //  0, "The second sentence was exactly repeated!",
      //], [
        "Nearly 6 in 10 Americans say they should be required to serve gay or lesbian couples just as they would heterosexual couples . A new poll finds 57 % feel businesses like gazelle or ▃ should be required to serve gay or lesbian couples .",
        0, "Even though the second sentence is more precise by mentioning a poll the two sentences basically convey the exact same information.",
      ], [
        "Bell was stopped in his Chevrolet after a police officer noticed a strong smell of marijuana . Bell was stopped in his Chevrolet after a police officer noticed a strong smell of marijuana . Bell has been charged with marijuana possession .",
        2, "Even though some sentences are repeated, the last sentence provides new information, that Bell was charged.",
      ]],
  },
  "clarity": {
    "title": "How often could you understand who/what was mentioned in the summary?",
    "definition": (<p>In a good summary, it should be easy to identify who or what
      pronouns (<i>"he"</i>) and noun phrases (<i>"the law"</i>) are referring to
      within the summary.</p>),
    "example5": "you can identify every person/organization/place mentioned.",
    "example1": "you can't identify anyone/anything mentioned.",
    "questions": [
      ["The American Pharmacists Association is discouraging its members from participating in executions . The group acted this week because of increased public attention on lethal injection .",
        4, "It's absolutely clear which group acted in the second sentence."
      ], [
        "The group votes at the meeting to adopt a ban as an official policy . The group is banning the use of the term `` drug '' for the chemicals used.",
        0, "It's not at all clear which group or which chemicals are being talked about.",
      ], [
        "The planet closest to the sun in our solar system is about 93 million miles from the Sun . The probe was launched in 2004 and traveled more than six and a half years before it started orbiting Mercury .",
        2, "It only becomes clear that the planet being talked about in the first sentence is Mercury after reading the second sentence, and it's still not clear which probe is being discussed.",
      ]],
  },
  "focus": {
    "title": "How clear was the focus of the summary?",
    "definition": (<p>A good summary has a clear focus and sentences should only contain information that is related to the rest of the summary.</p>),
    "example5": "you can identify a single common thread across the summary.",
    "example1": "each sentence discusses a separate, unrelated subject.",
    "questions": [
      ["Iraqi and U.S.-LED coalition forces say they retook a key refinery from Isis . Peshmerga forces also report retaking terrain from Isis .",
        4, "Both sentences talk about military advances against ISIS."
      ], [
        "Jeffrey Sachs : Raw Capitalism is the economics of greed . Last year was the earth 's hottest year on record , he says .",
        0, "The second sentence seems to be talking about something completely different from the first!",
      ], [
        "Isis claims it controlled part of the facility , posting images online that purported to back up the claim . Iraq is working to fortify the facility 's defenses , the council said . The Peshmerga are the national military force of Kurdistan .",
        2, "While the sentences generally talk about the situation in Iraq, the first two sentences are about a particular facility, while the last sentence does not have any clear connection with the first two.",
      ]],
  },
  "coherence": {
    "title": "How coherent was the summary?",
    "definition": (<p>A coherent summary should be well-structured in that it should
      not just be a heap of related information, but should build from
      sentence to sentence to a coherent body of information about a
      topic.</p>),
    "example5": "the summary has a clear flow, from a beginning, middle and end.",
    "example1": "the ordering of the sentences makes no sense.",
    "questions": [
      ["The Soviets invaded Poland in World War II and deported hundreds of thousands of people . Tomasz Lazar photographed some of these Poles and listened to their stories .",
        4, "The first sentence establishes context and the second sentence builds on that context."
      ], [
        "Tomasz ▃ was shocked to discover his mother 's dying wish . He spent hours photographing and interviewing men in the 1940s . He spent hours photographing and held thousands of thousands of Poles . ▃'s grandfather asked his grandson to return home to Poland .",
        0, "The three sentences have no temporal or causal relationship with each other!",
      ], [
        "Bates -- the Tulsa County , reserve sheriff 's deputy accused of manslaughter in the death of a fleeing suspect . Bates told investigators he mistook his firearm for the stun gun . Robert Bates says he gets it , how you might wonder how a cop could confuse a pistol for a stun gun . ",
        3, "There seems to be a rather clear story arc, starting with the event of Bates' shooting, his defense and finally his explanation for it. However, the final sentence seems to be left open ended.",
      ]],
  },
};
App.tutorialAnswers = getAnswers(App.tutorial);

App.defaultProps = {
  contents: {id:"", text: "This is a test sentence.", reference: "This is another sentence."},
  estimatedTime: 90,
  reward: 0.30,
}

export default App;
