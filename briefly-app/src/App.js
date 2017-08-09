import React, { Component } from 'react';
import './App.css';
import InformationComponent from './InformationComponent.js'
import DocumentComponent from './DocumentComponent.js'

class App extends Component {
  title = "Highlight the most important portions of this article";
  subtitle = "";

  article() {
    return (<div>
      <h2>Base Motives</h2>
      <p>Trump panders exclusively to the minority of people who love
      him—and to hell with the rest of America. That’s exactly what
      Putin wants.</p>
      <p>
      On Jan. 6, two weeks before Donald Trump was sworn in as
      president, leaders of the U.S. intelligence community presented
      him with a report on Russian interference in the 2016
      U.S. presidential election. Since then, Trump has refused to accept their consensus on Russia’s
      guilt, and his aides have been caught—in a chain of emails from June 2016—colluding with Russian intermediaries. But out
      in the open, Trump has done something far more destructive. He has
      pursued the central Russian objective outlined in the report: the
      political dissolution of the United States.
      </p>
      <p>
      The overarching goal of Vladimir Putin’s hacking and
      disinformation campaign, according to the Jan. 6 report, wasn’t to
      elect Trump or defeat Hillary Clinton. It was to “undermine public
      faith in the US democratic process.” An appendix to the report
      noted that Russian propaganda in the U.S. “aimed at promoting
      popular dissatisfaction with the US Government.” A separate expert
      analysis prepared in October by the nonpartisan Center
      for Strategic and International Studies and outlined to Congress in March described
      Russia’s strategy of sabotaging democracies by “deepening
      political divides,” “weakening the internal cohesion of
      societies,” and “using democratically elected individuals in
      positions of power to challenge the liberal system from within.”
      </p>
      </div>
    );
  }

  render() {
    let articleTitle = "Please highlight between 100-200 words in the article below that you think capture the most important aspects.";
    let articleText = this.article();

    return (
      <div className="App">
        <div className="container">
          <div className="row header">
            <h2>{this.title}</h2>
            <h2><small>{this.subtitle}</small></h2>
          </div>
          <div className="row">
          <div className="col-md-8">
            <DocumentComponent title={articleTitle} contents={articleText} /> 
          </div>
          <div className="col-md-4">
            <InformationComponent estimatedTime={4} wordCount={100} reward={0.7} /> 
          </div>
        </div>
      </div>
      </div>
    );
  }
}

export default App;
