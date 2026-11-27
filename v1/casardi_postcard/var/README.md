# Dati temporanei · solo edizione Python

L’edizione principale **EXE Windows / servizio Go non scrive PNG su disco**: una sola copia temporanea in RAM, azzerata a scadenza/reset/nuova sessione/arresto. Il file HTML autonomo lavora nella memoria della pagina.

Queste directory riguardano soltanto il kiosk Python facoltativo:

- `exports/`: PNG temporanei dei visitatori, mai da includere in ZIP o backup.
- `thumbs/`: miniature pubbliche degli ambienti, rigenerabili, nessun dato visitatore.
- `qa_exports/`: solo collaudo HTTP isolato; deve restare vuota al termine.

Scadenza iniziale 600 secondi, configurabile 300–600; reset per sessione, pulizia all’arresto e rimozione di orfani PNG/.part all’avvio. Nessuna galleria permanente e nessun file ultima_cartolina.png. Non far condividere la cartella export a due processi.

Le copie salvate volontariamente nella cartella **Download** o Foto non sono temporanee per l’app e non sono cancellabili da remoto. Gestirle separatamente. Lo script di packaging esclude tutto il contenuto di var, tranne questo avviso.
