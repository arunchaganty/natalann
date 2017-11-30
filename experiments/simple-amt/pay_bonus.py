import argparse, json
import simpleamt
from boto.mturk.price import Price
import csv

if __name__ == '__main__':
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('-P', '--prod', action='store_false', dest='sandbox',
                                            default=True,
                                            help="Whether to run on the production AMT site.")
    parser.add_argument('-a', '--assignment_ids_file')
    parser.add_argument('-f', action='store_true', default=False)
    parser.add_argument('-c', '--config', default='config.json', type=simpleamt.json_file)
    args = parser.parse_args()
    mtc = simpleamt.get_mturk_connection_from_args(args)

    if args.assignment_ids_file is None:
        parser.error('Must specify --assignment_ids_file.')

    with open(args.assignment_ids_file, 'r') as f:
        assignment_ids = list(csv.reader(f))

    for worker_id, a_id, bonus in assignment_ids:
        a = mtc.grant_bonus(worker_id, a_id, Price(amount=bonus, currency_code="USD"), "Completing tutorial")
#
#    print(('This will approve %d assignments and reject %d assignments with '
#                 'sandbox=%s' % (len(approve_ids), len(reject_ids), str(args.sandbox))))
#    print('Continue?')
#
#    if not args.f:
#        s = input('(Y/N): ')
#    else:
#        s = 'Y'
#    if s == 'Y' or s == 'y':
#        print('Approving assignments')
#        for idx, assignment_id in enumerate(approve_ids):
#            print('Approving assignment %d / %d' % (idx + 1, len(approve_ids)))
#            mtc.approve_assignment(assignment_id)
#        for idx, assignment_id in enumerate(reject_ids):
#            print('Rejecting assignment %d / %d' % (idx + 1, len(reject_ids)))
#            mtc.reject_assignment(assignment_id, feedback='Invalid results')
#    else:
#        print('Aborting')
