# Natalann
Natalann aims to be a simple, useful library to build natural language annotation interfaces.
This is manifest in two ways: first, we have a number of simple widgets that are broadly useful and secondly, we have tested interfaces to annotate a variety of tasks ranging from editing summaries to rating question answer correctness.

# Design principles

* **Easy to extend**: each widget is simple and self-contained, allowing it to be easily reused across interfaces.
* **Good defaults**: when there are several choices, we try to provide a default that we found to work well in practice.
* **Self-instructional**: each widget tries to make it apparent how to use it using relevant icons and tooltips.

# Usage

Natalann is built on [React](https://reactjs.org) and uses its default toolchain to build interfaces.
* To locally develop an interface, just call `npm run serve <AppName>` (e.g. `npm run serve RatingApp`).
* To deploy this interface as a library, call `npm run build <AppName>` (e.g. `npm run build RatingApp`) to compile the Javascript into a single file found in `build/<AppName>/index.js`.

The best way to understand how to build your own interface is to adapt one of the existing interfaces, e.g. `RatingApp`.

# Featured widgets

* The `DocumentWidget` that allows displaying highlighted regions of documents as well as allowing users to annotate these regions.
* More to come.
