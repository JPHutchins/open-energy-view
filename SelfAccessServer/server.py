from http.server import BaseHTTPRequestHandler, HTTPServer
import time

class holder:
    def __init__(self):
        self.messages = []

    def add_message(self, message):
        self.messages.append(message)

    def print(self):
        print([message for message in self.messages])

def catalog(data, library):
    library.add_message(data)
    library.print()

class handler(BaseHTTPRequestHandler):

    library = holder()

    def do_POST(self):
        if self.path == '/pgesmd':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            content_len = int(self.headers.get('Content-Length'))
            body = self.rfile.read(content_len)
            catalog(body, self.library)


def run(server_class=HTTPServer):
    server_address = ('', 7999)
    httpd = server_class(server_address, handler)
    httpd.serve_forever()

if __name__ == '__main__':

    try:
        run()
    except KeyboardInterrupt:
        pass
