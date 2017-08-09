import React, { Component } from 'react';
import './App.css';
import Information from './Information.js'
import Document from './Document.js'

class App extends Component {
  title = "Highlight the most important portions of this article";
  subtitle = "";

  render() {
    let articleTitle = "Please highlight between 100-200 words in the article below that you think capture the most important aspects.";

    return (
      <div className="App">
        <div className="container">
          <div className="row header">
            <h2>{this.title}</h2>
            <h2><small>{this.subtitle}</small></h2>
          </div>
          <div className="row">
          <div className="col-md-8">
            <Document id="document" title={articleTitle} contents={this.props.contents} /> 
          </div>
          <div className="col-md-4">
            <Information estimatedTime={4} wordCount={100} reward={0.7} /> 
          </div>
        </div>
      </div>
      </div>
    );
  }
}

export default App;
