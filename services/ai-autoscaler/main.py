from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request, json, math
history_rps = [10, 12, 15]
class AIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200); self.end_headers(); self.wfile.write(b'OK'); return
        if self.path == '/api/ai-status':
            total_req = 0
            for url in ['http://order-service:3003/metrics', 'http://booking-service:3004/metrics']:
                try:
                    req = urllib.request.urlopen(url, timeout=1).read().decode('utf-8')
                    total_req += int(req.strip().split(' ')[-1])
                except: pass
            history_rps.append(total_req)
            if len(history_rps) > 10: history_rps.pop(0)
            growth_rate = (history_rps[-1] - history_rps[0]) / max(1, len(history_rps))
            predicted = max(1, int(total_req + growth_rate * 5))
            recs = min(10, max(2, math.ceil(predicted / 5)))
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers()
            res = {"current_requests": total_req, "predicted_load_next_5m": predicted, "recommended_replicas": recs, "model": "Linear ML Predictor v1.0", "status": "SCALING_UP" if recs > 2 else "STABLE"}
            self.wfile.write(json.dumps(res).encode('utf-8'))
HTTPServer(('0.0.0.0', 3007), AIHandler).serve_forever()
