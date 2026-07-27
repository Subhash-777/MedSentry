import http.server
import socketserver
import os

class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        with open('/home/subhash/projects/MedSentry/jwt.txt', 'wb') as f:
            f.write(post_data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")
        print("JWT received!")
        # Stop server after receiving
        def kill_server():
            import threading
            threading.Thread(target=self.server.shutdown).start()
        kill_server()

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("", 8080), Handler)
print("Listening on 8080...")
httpd.serve_forever()
