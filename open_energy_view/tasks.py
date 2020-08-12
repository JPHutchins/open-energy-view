from functools import wraps
import threading
import time
import uuid
from datetime import datetime
from flask import abort, current_app, g, request, url_for
from werkzeug.exceptions import HTTPException, InternalServerError
from . import resources

# Code adapted from Miguel Grinberg - "Flask at Scale" - PyCon 2016


tasks = {}


def task_gc_loop():
    """Start a background thread that cleans up old tasks."""

    def clean_old_tasks():
        """
        This function cleans up old tasks from our in-memory data structure.
        """
        global tasks
        while True:
            # Only keep tasks that are running or that finished less than 5
            # minutes ago.
            five_min_ago = datetime.timestamp(datetime.utcnow()) - 5 * 60
            tasks = {
                task_id: task
                for task_id, task in tasks.items()
                if "finished_at" not in task or task["finished_at"] > five_min_ago
            }
            time.sleep(60)

    if True:
        print("start thread")
        thread = threading.Thread(target=clean_old_tasks)
        thread.start()


def async_api(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        def task_call(flask_app, environ):
            # Create a request context similar to that of the original request
            # so that the task can have access to flask.g, flask.request, etc.
            with flask_app.request_context(environ):
                try:
                    tasks[task_id]["return_value"] = f(*args, **kwargs)
                except HTTPException as e:
                    print(e)
                    tasks[task_id]["return_value"] = current_app.handle_http_exception(
                        e
                    )
                except Exception as e:
                    # The function raised an exception, so we set a 500 error
                    print(e)
                    tasks[task_id]["return_value"] = InternalServerError()
                    if True:
                        # We want to find out if something happened so reraise
                        raise
                finally:
                    # We record the time of the response, to help in garbage
                    # collecting old tasks
                    tasks[task_id]["finished_at"] = datetime.timestamp(
                        datetime.utcnow()
                    )

                    # close the database session (if any)

        # Assign an id to the asynchronous task
        task_id = uuid.uuid4().hex

        # Record the task, and then launch it
        tasks[task_id] = {
            "task_thread": threading.Thread(
                target=task_call,
                args=(current_app._get_current_object(), request.environ),
            )
        }
        tasks[task_id]["task_thread"].start()

        # Return a 202 response, with a link that the client can use to
        # obtain task status
        print(url_for("gettaskstatus", task_id=task_id))
        return "accepted", 202, {"Location": url_for("gettaskstatus", task_id=task_id)}

    return wrapped


class GetTaskStatus(resources.Resource):
    def get(self, task_id):
        """
        Return status about an asynchronous task. If this request returns a 202
        status code, it means that task hasn't finished yet. Else, the response
        from the task is returned.
        """
        
        task = tasks.get(task_id)
        if task is None:
            abort(404)
        if "return_value" not in task:
            return "", 202, {"Location": url_for("gettaskstatus", task_id=task_id)}
        return task["return_value"]
