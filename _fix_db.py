import sqlite3
c = sqlite3.connect('server_python/data/airops.sqlite')

# Update rag_chunks
c.execute("UPDATE rag_chunks SET document_title = REPLACE(document_title, 'AirOps', 'Papagaio Fly')")
c.execute("UPDATE rag_chunks SET content = REPLACE(content, 'AirOps', 'Papagaio Fly')")

c.commit()
c.close()
print("Updated rag_chunks to Papagaio Fly")
