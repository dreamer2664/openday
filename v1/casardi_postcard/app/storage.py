"""Short-lived PNG storage. Single-process, lock-protected; no names or jobs.

Tokens carry 192 random bits. An owner is a separate, signed-cookie capability,
never a visitor name. A reset increments its generation, cancelling even an
export that is still rendering. Only token routes expose the stored files.
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import os
import re
import secrets
import threading
import time

TOKEN = re.compile(r'^[A-Za-z0-9_-]{32}$')

@dataclass
class Card:
    token: str
    owner: str
    path: Path
    created: float
    expires: float
    credit: dict
    downloads: int = 0

class CancelledExport(Exception):
    pass

class CardStore:
    def __init__(self, directory, ttl=600, clock=time.time, clean_start=True):
        if not 300 <= ttl <= 600:
            raise ValueError('La scadenza deve essere compresa fra 300 e 600 secondi.')
        self.directory=Path(directory)
        self.directory.mkdir(parents=True,exist_ok=True)
        self.ttl=ttl
        self.clock=clock
        self.lock=threading.RLock()
        self.cards={}
        self.generations={}
        self.stop_event=threading.Event()
        if clean_start:
            # Tokens are in RAM. Files from a previous process cannot be reached;
            # remove them immediately rather than waiting another ten minutes.
            for p in self.directory.iterdir():
                if p.is_file() and (p.suffix in ('.png','.part')):
                    p.unlink(missing_ok=True)

    def generation(self, owner):
        with self.lock: return self.generations.get(owner,0)

    def _delete(self, token):
        card=self.cards.pop(token,None)
        if card: card.path.unlink(missing_ok=True)

    def register(self, owner, generation, data, credit):
        with self.lock:
            if self.stop_event.is_set() or self.generations.get(owner,0) != generation:
                raise CancelledExport()
            for token,c in list(self.cards.items()):
                if c.owner==owner: self._delete(token)
            token=secrets.token_urlsafe(24)
            path=self.directory/(token+'.png')
            tmp=self.directory/(token+'.part')
            try:
                with tmp.open('wb') as f: f.write(data)
                os.replace(tmp,path)
            finally:
                tmp.unlink(missing_ok=True)
            now=self.clock()
            card=Card(token,owner,path,now,now+self.ttl,credit)
            self.cards[token]=card
            return card

    def get(self, token):
        if not TOKEN.fullmatch(token): return None,404
        with self.lock:
            c=self.cards.get(token)
            if not c: return None,404
            if c.expires<=self.clock():
                self._delete(token)
                return None,410
            if not c.path.is_file():
                self._delete(token)
                return None,404
            return c,200

    def read(self, token, download=False):
        with self.lock:
            c,status=self.get(token)
            if not c: return None,None,status
            data=c.path.read_bytes()
            if download: c.downloads+=1
            return c,data,200

    def reset(self, owner):
        with self.lock:
            self.generations[owner]=self.generations.get(owner,0)+1
            tokens=[t for t,c in self.cards.items() if c.owner==owner]
            for t in tokens: self._delete(t)
            return len(tokens)

    def purge(self):
        with self.lock:
            expired=[t for t,c in self.cards.items() if c.expires<=self.clock()]
            for t in expired: self._delete(t)
            return len(expired)

    def stats(self):
        self.purge()
        with self.lock:
            return [dict(expires_in=max(0,int(c.expires-self.clock())),downloads=c.downloads)
                    for c in self.cards.values()]

    def start_cleaner(self):
        def loop():
            while not self.stop_event.wait(1):
                try: self.purge()
                except OSError: pass
        threading.Thread(target=loop,name='temporary-card-cleaner',daemon=True).start()

    def close(self):
        self.stop_event.set()
        with self.lock:
            for t in list(self.cards): self._delete(t)
