#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Turk experiment helper.
"""

import pdb
import re
import os
import sys
import csv
import json
import html
from datetime import datetime
import logging
from collections import namedtuple

import numpy as np

from fabric.api import local, run, env
from bottle import Bottle, static_file, jinja2_view
from bottle import run as run_bottle

from stats import krippendorff_alpha
from util import load_jsonl, save_jsonl
from util import unroll_data, parse_data, get_violation_summaries, prepare_rejection_reports
from util import group_by_hit, data_to_alpha

env.hosts = ['every-letter.com']
env.host = 'every-letter.com'
env.host_string = 'every-letter.com'

logger = logging.getLogger(__name__)

ISO_FORMAT = '%Y-%m-%dT%H:%M:%SZ'

Experiment = namedtuple('Experiment', 'type idx date'.split())
def parse_exp_dir(exp_dir):
    exp_re = re.compile('(?P<type>[a-z]+).(?P<idx>[0-9]+)-(?P<date>[0-9]{8})')
    exp_dir = os.path.basename(exp_dir)

    m = exp_re.match(exp_dir)
    return m and Experiment(m.group('type'), m.group('idx'), m.group('date'))

def list_exp_dirs_for_type(root, experiment_type):
    ret = []
    for dirname in os.listdir(root):
        exp = parse_exp_dir(dirname)
        if exp and exp.type == experiment_type:
            ret.append(dirname)
    return sorted(ret)

def get_exp_dir(args, path=None):
    def _get_exp_dir(x):
        return os.path.join(args.experiment_root, x)
    if not path:
        path = args.type

    if os.path.exists(_get_exp_dir(path)):
        exp_dir = _get_exp_dir(path)
    else:
        exps = list_exp_dirs_for_type(args.experiment_root, args.type)
        if len(exps) == 0:
            logger.fatal("No experiments initialized for %s.", args.type)
        exp_dir = exps[-1]
    return exp_dir

def check_reward(exp_dir):
    with open('{exp_dir}/hit_properties.json'.format(exp_dir=exp_dir)) as f:
        props = json.load(f)
    with open('{exp_dir}/inputs.json'.format(exp_dir=exp_dir)) as f:
        for line in f:
            task = json.loads(line)
            assert task["reward"] == props["reward"], "Inconsistent reward; properties is {0}, task is {1}, please check!".format(props["reward"],task["reward"])
    return True

def adjust_for_dev(exp_dir):
    with open('{exp_dir}/hit_properties.json'.format(exp_dir=exp_dir)) as f:
        props = json.load(f)
    props["max_assignments"] = 1
    props["hits_approved"] = 0
    props["percent_approved"] = 0
    with open('{exp_dir}/.hit_properties_test.json'.format(exp_dir=exp_dir), 'w') as f:
        json.dump(props, f)
    with open('{exp_dir}/inputs.json'.format(exp_dir=exp_dir), 'r') as f, open('{exp_dir}/.inputs_test.json'.format(exp_dir=exp_dir), 'w') as g:
        line = next(f)
        g.write(line)

def do_init(args):
    # 0. Find experiment number.
    tmpl_dir = get_exp_dir(args, "template")
    exps = list_exp_dirs_for_type(args.experiment_root, args.type)
    exp_dir = os.path.join(args.experiment_root, "{}.{}-{:%Y%m%d}".format(args.type, len(exps), datetime.now()))

    # 1. copy over template directory.
    logger.info("Creating new experiment directory %s", exp_dir)
    if exps:
        local("cp -r {0} {1} && rm -rf {1}/static/*".format(exps[-1], exp_dir))
    else:
        local("cp -r {0} {1} && rm -rf {1}/static/*".format(tmpl_dir, exp_dir))

    # 2. copy build.
    local("cd ../briefly-app && npm run build prod config/paths.{0}.js && mv build/{0}/* ../experiments/{1}/static/".format(args.type, exp_dir))

def do_update_interface(args):
    # 0. Find experiment number.
    exp_dir = get_exp_dir(args)

    # 1. copy over template directory.
    logger.info("Updating interface for experiment directory %s", exp_dir)
    local("rm -rf {0}/static/*".format(exp_dir))
    # 2. copy build.
    local("cd ../briefly-app && npm run build prod config/paths.{0}.js && mv build/{0}/* ../experiments/{1}/static/".format(args.type, exp_dir))

# User needs to set up input at this stage.
def do_view(args):
    # 0. Find experiment dir.
    exp_dir = get_exp_dir(args)

    inputs = [json.loads(line) for line in open(os.path.join(exp_dir, 'inputs.json'))]

    # Start server.
    app = Bottle()

    @jinja2_view('{}/static/index.html'.format(exp_dir))
    def view(idx=0):
        idx = int(idx)
        if idx < len(inputs):
            return {'input': html.escape(json.dumps(inputs[idx])), 'SERVER_URL': 'http://localhost:8080'}
        else:
            return {'SERVER_URL': 'http://localhost:8080'}

    def get_resource(path):
        return static_file(path, root=os.path.join(exp_dir, 'static', 'static'))

    app.route('/<idx:int>', 'GET', view)
    app.route('/', 'GET', view)
    app.route('/static/<path:path>', 'GET', get_resource)
    run_bottle(app, host="localhost", port=8080)

def do_deploy(args):
    # 0. Find experiment dir.
    exp_dir = get_exp_dir(args)
    exp = parse_exp_dir(exp_dir)
    assert exp

    check_reward(exp_dir)

    # 1. Deploy static directory to the server.
    local('rm -rf {exp_dir}/deploy && cp -r {exp_dir}/static {exp_dir}/deploy'.format(exp_dir=exp_dir))
    local('for f in `find {exp_dir}/deploy -type f`; do sed -i "s#{{{{SERVER_URL}}}}#https://every-letter.com/briefly/{exp.type}.{exp.idx}#g" $f; done'.format(exp_dir=exp_dir, exp=exp))
    run('cd every-letter.com/briefly && rm -rf {exp.type}.{exp.idx}'.format(exp=exp))
    local('scp -r ./{exp_dir}/deploy {host}:every-letter.com/briefly/{exp.type}.{exp.idx}'.format(exp_dir=exp_dir, exp=exp, host=args.host))

    # tweak properties.
    if not args.prod:
        adjust_for_dev(exp_dir)
        prod_flag, props_path, inputs_path = '', '{exp_dir}/.hit_properties_test.json'.format(exp_dir=exp_dir), '{exp_dir}/.inputs_test.json'.format(exp_dir=exp_dir)
    else:
        prod_flag, props_path, inputs_path = '-P', '{exp_dir}/hit_properties.json'.format(exp_dir=exp_dir), '{exp_dir}/inputs.json'.format(exp_dir=exp_dir)

    # 2. Iterate through input and launch HITs (optionally on
    #    production).
    local('python3 simple-amt/launch_hits.py -c simple-amt/config.json {prod_flag} -H {exp_dir}/hit_ids.txt -p {props_path} -t {exp_dir}/deploy/index.html -i {inputs_path}'.format(
        prod_flag=prod_flag, exp_dir=exp_dir, props_path=props_path, inputs_path=inputs_path))

def do_sync(args):
    # 0. Find experiment dir.
    exp_dir = get_exp_dir(args)

    # 1. Call get_results -- if complete, run aggregation.
    local('python3 simple-amt/get_results.py -c simple-amt/config.json {prod} -H {dir}/hit_ids.txt > {dir}/responses.json'.format(dir=exp_dir, prod="-P" if args.prod else ""))
    local('python3 simple-amt/aggregate_results.py -c simple-amt/config.json -H {dir}/hit_ids.txt -i {dir}/responses.json -o {dir}/outputs.json'.format(dir=exp_dir))
    local('python3 simple-amt/show_hit_progress.py -c simple-amt/config.json {prod} -H {dir}/hit_ids.txt'.format(dir=exp_dir, prod="-P" if args.prod else ""))

def do_qa(args):
    # 0. Find experiment dir.
    exp_dir = get_exp_dir(args)

    # 1. Read outputs into a matrix.
    inputs = load_jsonl(os.path.join(exp_dir, "inputs.json"))
    outputs = load_jsonl(os.path.join(exp_dir, "outputs.json"))

    raw = unroll_data(inputs, outputs, ignore_rejects=False)
    # Grab the essential data for every output
    data = parse_data(raw)

    # compute violators and remove them
    violations = get_violation_summaries(raw, data)
    reports = prepare_rejection_reports(violations)
    logger.warning("Found %d violating assignments from %d workers to reject", len(violations), len({worker for _, _, worker in violations}))

    rejections = {assignment_id for _, assignment_id, _ in violations}
    acceptances = {assignment_id for _, assignment_id, _ in data if assignment_id not in rejections}
    bonuses = {worker_id: assignment_id for _, assignment_id, worker_id in data if assignment_id not in rejections}

    with open(os.path.join(exp_dir, "approved_assignments.txt"), "w") as f:
        for id_ in sorted(acceptances):
            f.write(id_)
            f.write("\n")

    with open(os.path.join(exp_dir, "approved_bonuses.txt"), "w") as f:
        writer = csv.writer(f)
        for worker_id, assignment_id in sorted(bonuses.items()):
            writer.writerow([worker_id, assignment_id, 0.50])

    with open(os.path.join(exp_dir, "rejected_assignments.txt"), "w") as f:
        writer = csv.writer(f)
        for id_ in sorted(rejections):
            writer.writerow([id_, reports[id_]])

    # Update outputs with rejections
    save_jsonl(os.path.join(exp_dir, "outputs.bk.json"), outputs)
    for output in outputs:
        for response in output:
            if response["assignment_id"] in rejections:
                response["rejected"] = True
    save_jsonl(os.path.join(exp_dir, "outputs.json"), outputs)

def do_process(args):
    # 0. Find experiment dir.
    exp_dir = get_exp_dir(args)

    # 1. Read outputs into a matrix.
    inputs = load_jsonl(os.path.join(exp_dir, "inputs.json"))
    outputs = load_jsonl(os.path.join(exp_dir, "outputs.json"))

    raw = unroll_data(inputs, outputs)
    # Grab the essential data for every output
    data = parse_data(raw)

    responses = group_by_hit(data)
    ret = []
    mads = []
    fields = ["worker_time", "actual_time", "grammar", "redundancy", "clarity", "focus", "coherence", "overall"]

    for hit, response in sorted(responses.items()):
        median = np.median(response, 0)
        mean = np.mean(response, 0)
        mad = np.mean(abs(response - median), 0)
        mads.append(mad)
        ret.append({"input": raw[hit]["input"], "output": {k: v for k, v in zip(fields[2:], mean[2:])}})
    save_jsonl(os.path.join(exp_dir, "data.json"), ret)

    with open(os.path.join(exp_dir, "mads.txt"), "w") as f:
        for field, mad in zip(fields[2:], np.mean(mads, 0)[2:]):
            logger.info("{}\t{:.3f}".format(field, mad))
            f.write("{}\t{:.3f}\n".format(field, mad))

    # Compute Krippendor's alpha for the batch and save it.
    with open(os.path.join(exp_dir, "alphas.txt"), "w") as f:
        alpha_data = data_to_alpha(data)
        for field in fields[2:]:
            alpha = krippendorff_alpha(alpha_data[field], "ordinal", 5)
            logger.info("{}\t{:.3f}".format(field, alpha))
            f.write("{}\t{:.3f}\n".format(field, alpha))

def do_complete(args):
    # 0. Find experiment dir.
    exp_dir = get_exp_dir(args)

    # 1. Call get_results -- if complete, run aggregation.
    local('python3 simple-amt/approve_assignments.py -c simple-amt/config.json {prod} -a {dir}/approved_assignments.txt'.format(dir=exp_dir, prod="-P" if args.prod else ""))
    local('python3 simple-amt/reject_assignments.py -c simple-amt/config.json {prod} -a {dir}/rejected_assignments.txt'.format(dir=exp_dir, prod="-P" if args.prod else ""))
    local('touch {dir}/complete.marker'.format(dir=exp_dir))

def do_clean(args):
    # 0. Find experiment dir.
    exp_dir = get_exp_dir(args)
    local('python3 simple-amt/disable_hits.py -c simple-amt/config.json {prod} -H {dir}/hit_ids.txt'.format(dir=exp_dir, prod="-P" if args.prod else ""))

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    import argparse
    parser = argparse.ArgumentParser(description='Helper to run turk experiments.')
    parser.add_argument('-er', '--experiment-root', default='.', help="Root directory for experiments")
    parser.add_argument('--simple-amt', default='simple-amt', help="Path to simple-amt.")
    parser.add_argument('-P', '--prod', action='store_true', help="Use production?")
    parser.set_defaults(func=None)

    subparsers = parser.add_subparsers()
    command_parser = subparsers.add_parser('init', help='Initialize a new experiment directory of a particular type')
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_init)

    command_parser = subparsers.add_parser('update', help='Updates an interface for an experiment')
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_update_interface)

    command_parser = subparsers.add_parser('view', help='View an experiment')
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_view)

    command_parser = subparsers.add_parser('deploy', help='Deploy an experiment onto the server and turk')
    command_parser.add_argument('-H', '--host', type=str, default='every-letter.com', help="Where to upload")
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_deploy)

    command_parser = subparsers.add_parser('sync', help='Initialize a new experiment directory of a particular type')
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_sync)

    command_parser = subparsers.add_parser('qa', help='Identify accepts and rejects')
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_qa)

    command_parser = subparsers.add_parser('complete', help='Take care of payments')
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_complete)

    command_parser = subparsers.add_parser('process', help='Summarize output.')
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_process)

    command_parser = subparsers.add_parser('clean', help='Deletes HITs from AMT')
    command_parser.add_argument('type', type=str, help="Type of experiment to initialize")
    command_parser.set_defaults(func=do_clean)

    ARGS = parser.parse_args()
    if ARGS.func is None:
        parser.print_help()
        sys.exit(1)
    else:
        ARGS.func(ARGS)
