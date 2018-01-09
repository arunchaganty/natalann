"""
Utility functions for boto.
"""
import boto3

def get_client(args):
    if args.prod:
        return boto3.client('mturk')
    else:
        raise NotImplementedError()

def get_assn(conn, assn_id):
    return conn.get_assignment(AssignmentId=assn_id)

def pay_bonus(conn, worker_id, assn_id, amount=.5, reason='completing tutorial'):
    conn.send_bonus(
        AssignmentId=assn_id,
        WorkerId=worker_id,
        BonusAmount=str(amount),
        Reason=reason,
        )

def update_qualifications(conn, qual_id, worker_id, update, min_limit=0, max_limit=105):
    value = conn.get_qualification_score(
        QualificationTypeId=qual_id,
        WorkerId=worker_id,
        )["Qualification"]["IntegerValue"]
    value = min(max_limit, max(min_limit, update + value))

    conn.associate_qualification_with_worker(
        QualificationTypeId=qual_id,
        WorkerId=worker_id,
        IntegerValue=value+update,
        SendNotification=False,
        )

    return value

def redo_hit(conn, hit_id, num_redos=1):
    conn.create_additional_assignments_for_hit(
        HITId=hit_id,
        NumberOfAdditionalAssignments=num_redos,
        )
