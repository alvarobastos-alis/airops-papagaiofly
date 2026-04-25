import sqlite3
c = sqlite3.connect('server_python/data/airops.sqlite')
c.execute("UPDATE flight_segments SET airline='Papagaio Fly' WHERE airline='AirOps'")
c.commit()
r = c.execute("SELECT DISTINCT airline FROM flight_segments").fetchall()
print('Updated airline values:', r)
count = c.execute("SELECT COUNT(*) FROM flight_segments WHERE airline='Papagaio Fly'").fetchone()
print('Rows updated:', count[0])
c.close()
