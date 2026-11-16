"""Cloudflare Python Workers 用エントリ。FastAPI アプリ (server.py) をそのまま ASGI で動かす。"""

from workers import WorkerEntrypoint

import asgi
from server import app


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        return await asgi.fetch(app, request.js_object, self.env)
