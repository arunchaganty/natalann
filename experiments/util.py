"""
Utilities
"""

import json
import logging
from copy import deepcopy
from collections import defaultdict, OrderedDict
from datetime import timedelta

import numpy as np

logger = logging.getLogger(__name__)

def load_jsonl(fname):
    with open(fname) as f:
        return [json.loads(line) for line in f]

def save_jsonl(fname, objs):
    with open(fname, "w") as f:
        for obj in objs:
            f.write(json.dumps(obj))
            f.write("\n")

def unroll_data(inputs, outputs, ignore_rejects=True, min_batch=0):
    assert len(inputs) == len(outputs)

    ret = {}
    for input_, output in zip(inputs, outputs):
        batch_size = len(input_["contents"])

        batch_outputs = [[] for _ in range(batch_size)]
        for assn in output:
            if ignore_rejects and assn.get("rejected", False): continue

            assert len(assn["output"]["responses"]) == batch_size
            for i, response in enumerate(assn["output"]["responses"]):

                assn_ = deepcopy(assn)
                assn_["task_index"] = i
                assn_["output"]["responses"] = response
                batch_outputs[i].append(assn_)

        if len(batch_outputs[0]) < min_batch:
            logger.info("Skipping batch because it has only %d entries", len(batch_outputs[0]))
            continue

        for inp, out in zip(input_["contents"], batch_outputs):
            if out:
                ret["{}:{}".format(out[0]["hit_id"], out[0]["task_index"])] = {
                    "input": inp,
                    "responses": out,
                    }
    return ret

def parse_data(data, fields=None):
    if fields is None:
        fields = ["workerTime", "actualTime", "responses/grammar", "responses/redundancy", "responses/clarity", "responses/focus", "responses/coherence", "responses/overall"]

    ret = OrderedDict()
    for hit_id, datum in data.items():
        for response in datum["responses"]:
            response_ = response["output"]["responses"]
            if "overall" not in response_:
                logger.warning("Missing overall score for %s in %s; imputing", hit_id, response["assignment_id"])
                response_["overall"] = np.mean([response_["grammar"], response_["redundancy"], response_["clarity"], response_["focus"], response_["coherence"]])

            key = (hit_id, response["assignment_id"], response["worker_id"],)
            ret[key] = np.array([
                response["worker_time"],
                response["output"]["actualTime"],
                response_["grammar"],
                response_["redundancy"],
                response_["clarity"],
                response_["focus"],
                response_["coherence"],
                response_["overall"],
                ], dtype=np.int)
    return ret

def summarize_medians(data):
    ret = defaultdict(list)
    for (hit, _, _), response in data.items():
        ret[hit].append(response)

    for hit, vs in ret.items():
        m = np.median(vs, 0)
        mad = np.mean(np.abs((vs - m)), 0)
        ret[hit] = np.median(vs, 0), mad
    return ret

def get_controls(data):
    ret = {}
    for hit_id, datum in data.items():
        if not datum["input"].get('control'): continue

        expected = datum["input"]["expected"]
        assert all(v < 5 for v in expected.values())
        if expected.get('clarity') == 0: continue # Skip clarity controls; they're bad.
        ret[hit_id] = np.array([
            -1, -1,
            expected.get("grammar", -1),
            expected.get("redundancy", -1),
            expected.get("clarity", -1),
            expected.get("focus", -1),
            expected.get("coherence", -1),
            expected.get("overall", -1),
            ], dtype=np.int)
    return ret

def group_by_hit(data):
    ret = defaultdict(list)
    for (hit, _, _), response in data.items():
        ret[hit].append(response)
    return ret

def get_median_responses(data):
    ret = {}
    for hit, vs in group_by_hit(data).items():
        ret[hit] = np.median(vs, 0)
    return ret

_REJECTION_TEMPLATE = """Hello {worker_id},
We regret to inform you that we are rejecting your work for HIT
{hit_id}. We know that this is a subjective task, so we've taken a lot
of effort to ensure that our rejections are well-grounded and fair. The
reasons we are rejecting your work are as follows:

{reasons}

If you still disagree with our judgement, please contact us and we will
consider un-rejecting it.

Regards,
percyliangmturk@gmail.com"""

_VIOLATION_TEMPLATES = {
    "hit_time": """- We found that you took only
{worker_time} minutes to submit, with {actual_time} minutes spent
actually responding to the questions (i.e. excluding the tutorial),
which is less than third of the median time for the task
({median_worker_time} and {median_actual_time} respectively).""",
    "control_failed": """- In the task, we asked you to rate the following summary:
{summary}
We could not find your responses to be a reasonable judgement of quality, namely {differences}.
"""
}

_CONTROL_TEMPLATE = "for {cat} you rated _{actual}_ where we expected a response around *{expected}*"

_CAT_STRINGS = {
    "grammar": "how grammatical the summary was",
    "redundancy": "how non-redundant the summary was",
    "clarity": "how clear the mentioned people/organizations in summary were",
    "focus": "how focussed the summary was",
    "coherence": "how coherent the summary was",
    }

def prepare_rejection_reports(summary):
    ret = {}

    for (hit_id, assn, worker), violations in summary.items():
        reasons = "\n".join([_VIOLATION_TEMPLATES[violation_type].format(**kwargs) for (_, violation_type), kwargs in violations.items()])

        ret[assn] = _REJECTION_TEMPLATE.format(worker_id=worker, hit_id=hit_id, reasons=reasons)
    return ret

def get_violation_summaries(raw, data):
    """
    summarizes information about how badly the worker did.
    """
    ret = defaultdict(dict)

    #median_worker_time, median_actual_time = np.median([v[:2] for v in data.values()], 0).tolist()
    median_worker_time, median_actual_time = 541, 283 # np.median([v[:2] for v in data.values()], 0).tolist()

    for hit_id, datum in raw.items():
        hit_id_ = hit_id.split(":")[0]
        text = datum["input"]["text"]

        for response in datum["responses"]:
            assn = response["assignment_id"]
            worker = response["worker_id"]
            worker_time, actual_time = response["worker_time"], response["output"]["actualTime"]

            if worker_time < median_worker_time/3 and actual_time < median_actual_time/3:
                ret[hit_id_, assn, worker][hit_id_, "hit_time"] = {
                    "hit_id": hit_id_,
                    "actual_time": timedelta(seconds=int(actual_time)),
                    "worker_time": timedelta(seconds=int(worker_time)),
                    "median_actual_time": timedelta(seconds=int(median_actual_time)),
                    "median_worker_time": timedelta(seconds=int(median_worker_time)),
                    }

            if "expected" in datum["input"] and datum["input"]["expected"].get("clarity") != 0:
                # Ah, this is a control!
                violations = []
                for cat, expected in datum["input"]["expected"].items():
                    # right now these aren't reliable controls...
                    if expected == 4 or expected == 3: continue
                    actual = response["output"]["responses"][cat]
                    if abs(actual - expected) < 3: continue

                    violations.append(_CONTROL_TEMPLATE.format(
                        cat=_CAT_STRINGS[cat],
                        actual=actual+1,
                        expected=expected+1))

                if violations:
                    ret[hit_id_, assn, worker][hit_id_, "control_failed"] = {
                        "hit_id": hit_id_,
                        "summary": text,
                        "differences": " and ".join(violations)
                        }
    return ret

def data_to_alpha(data, fields=None):
    fields = ["worker_time", "actual_time", "grammar", "redundancy", "clarity", "focus", "coherence", "overall"]
    ret = defaultdict(lambda: defaultdict(dict))
    for (hit_id, _, worker_id), values in data.items():
        for field, value in zip(fields[2:], values[2:]):
            ret[field][worker_id][hit_id] = value
    return ret

def transpose(data):
    ret = defaultdict(dict)
    for key, values in data.items():
        for key_, value in values.items():
            ret[key_][key] = value
    return ret

def _factorize(data):
    """
    Try to learn turker and task scores as a linear model.
    """
    workers = sorted(data.keys())
    tasks = sorted({hit for hits in data.values() for hit in hits})
    n_entries = sum(len(hits) for hits in data.values())

    X = np.zeros((n_entries, len(workers)+len(tasks)))
    Y = np.zeros(n_entries)
    i = 0
    for worker, hits in data.items():
        for task, value in hits.items():
            X[i, workers.index(worker)] = 1
            X[i, len(workers) + tasks.index(task)] = 1
            Y[i] = value
            i += 1

    return X, Y

def _compute_mad(datas):
    tasks, workers = [], defaultdict(list)

    for data in datas:
        tasks_ = defaultdict(list)
        data_ = transpose(data)
        for task, responses in data_.items():
            median_response = np.median(list(responses.values()))
            for worker, response in responses.items():
                diff = median_response - response
                tasks_[task].append(diff)
                workers[worker].append(diff)
        tasks.append(tasks_)
    return tasks, workers

def _get_median_times(raw):
    ret = defaultdict(set)
    for datum in raw.values():
        for response in datum["responses"]:
            worker_id = response["worker_id"]
            submit_time = datetime.strptime(response["submit_time"], ISO_FORMAT)
            ret[worker_id].add((submit_time, response["worker_time"], response["output"]["actualTime"]))

    first_times_worker = []
    first_times_actual = []
    second_times_worker = []
    second_times_actual = []

    for vs in ret.values():
        vs = sorted(vs)
        _, worker_time, actual_time = vs[0]
        first_times_worker.append(worker_time)
        first_times_actual.append(actual_time)

        if len(vs) > 1:
            worker_time, actual_time = np.median([v[1:] for v in vs[1:]], 0).tolist()
            second_times_worker.append(worker_time)
            second_times_actual.append(actual_time)
    
    first_times_worker =  np.median(first_times_worker)
    first_times_actual =  np.median(first_times_actual)
    second_times_worker = np.median(second_times_worker)
    second_times_actual = np.median(second_times_actual)
    return first_times_worker, first_times_actual, second_times_worker, second_times_actual

def _check_controls(data):
    keys, values = [], []
    for hit_id, datum in data.items():
        if not datum["input"].get('control'): continue

        expected = datum["input"]["expected"]
        assert all(v < 5 for v in expected.values())
        if expected.get('clarity') == 0: continue # Skip clarity controls; they're bad.

        for response in datum["responses"]:
            response_ = response["output"]["responses"]

            keys.append([
                hit_id,
                response["assignment_id"],
                response["worker_id"],
                ])
            obj = {key: value - response_[key] for key, value in expected.items()}
            assert all(v < 5 for v in obj.values())
            #obj["worker"] = response_
            #obj["expected"] = expected
            values.append(obj)
    return keys, values

def _exclude_data(data, bad_workers):
    ret = {}
    for key, datum in data.items():
        datum_ = deepcopy(datum)
        datum_["responses"] = [r for r in datum_["responses"] if r["worker_id"] not in bad_workers]
        ret[key] = datum_
    return ret


PENN_NORMALIZATIONS = [
    ('``' , '"'),
    ('`'  , "'"),
    ("''" , '"'),
    ("'"  , "'"),
    ("_ELLIPSIS_"  , "..."),
    ("_ELLIPSIS_"  , "..."),
    ('-LRB-', '('),
    ('-RRB-', ')'),
    ('-LSB-', '['),
    ('-RSB-', ']'),
    ('-LCB-', '{'),
    ('-RCB-', '}'),
    ]
