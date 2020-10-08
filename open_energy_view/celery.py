from celery import Celery


celery = Celery(
    "tasks", backend="rpc://", broker="amqp://jp:admin@localhost:5672/myvhost",
)


celery.conf.update(
    {
        "imports": (
            "open_energy_view.celery_tasks",
            "open_energy_view.espi_helpers",
            "open_energy_view.utility_apis"
        ),
        "task_routes": {
            "get_jp": {"queue": "io"},
            "process_data": {"queue": "cpu"},
            "fake_fetch": {"queue": "io"},
            "fetch_task": {"queue": "io"},
            "insert_espi_xml_into_db": {"queue": "cpu"},
        },
        "task_serializer": "json",
        "result_serializer": "json",
        "accept_content": ["json"],
    }
)
