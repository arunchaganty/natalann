#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
A simple viewer for turk experiments.
"""
import re
import os
import pdb
import json
import html
from datetime import datetime

import jinja2
from bottle import Bottle, request, run, static_file, jinja2_view

app = Bottle()

experiment_re = re.compile(r'(?P<name>[a-z]+):(?P<version>[0-9]+)-(?P<date>[0-9]{8})')
instance_re = re.compile(r'(?P<id>[0-9]+).json')

def is_experiment_dir(name):
    return os.path.isdir(name) and experiment_re.match(os.path.basename(name))

def is_instance(name):
    return os.path.isfile(name) and instance_re.match(os.path.basename(name))

class Experiment(object):
    def __init__(self, path):
        m = experiment_re.match(os.path.basename(path))
        assert m is not None

        self.name = m.group("name")
        self.version = int(m.group("version"))
        self.date = datetime.strptime(m.group("date"), "%Y%m%d")
        self.path = path

        self.instances = []
        for f in os.listdir(os.path.join(self.path, 'input')):
            f = os.path.join(self.path, 'input', f)
            if is_instance(f):
                self.instances.append(Instance(self, f))

    def __repr__(self):
        return "<Experiment: {}:{}>".format(self.name, self.version)

    def __str__(self):
        return "{}:{}".format(self.name, self.version)

class Instance(object):
    def __init__(self, experiment, path):
        m = instance_re.match(os.path.basename(path))
        assert m is not None

        self.id = m.group("id")
        self.path = path
        self.experiment = experiment

    def __repr__(self):
        return "<Instance: {} {}>".format(self.experiment, self.id)

def load_data(root_directory):
    ret = {}
    for path in os.listdir(root_directory):
        path = os.path.join(root_directory, path)
        if not is_experiment_dir(path):
            continue

        e = Experiment(path)
        ret["{}:{}".format(e.name, e.version)] = e
    return ret

_experiments = {}

# Create a directory listing
@app.route('/<experiment>/<instance:int>/')
def view_instance(experiment, instance):
    experiment = _experiments[experiment]
    instance = experiment.instances[int(instance)]

    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(os.path.join(experiment.path, 'static')),
        autoescape=jinja2.select_autoescape(),
        )
    template = env.get_template("index.html")

    with open(instance.path, "r") as f:
        contents = json.load(f)
    obj = {"contents": contents, "reward": 0.30, "estimatedTime": 20,}

    return template.render(input=json.dumps(obj))

@app.route('/<experiment>/')
@jinja2_view('view.html', template_lookup=['templates'])
def view_experiments(experiment):
    experiment = _experiments[experiment]
    return {"experiment": experiment,
            "instances": sorted(experiment.instances, key=lambda e: e.id)}

@app.route('/<experiment>/static/<path:path>')
def get_resource(experiment, path):
    experiment = _experiments[experiment]
    return static_file(os.path.join('static', path), root=os.path.join(experiment.path, 'static'))

@app.route('/')
@jinja2_view('home.html', template_lookup=['templates'])
def home():
    return {"experiments": sorted(_experiments.items())}

if __name__ == "__main__":
    _experiments.update(load_data('.'))
    run(app, host="localhost", port=8080)
